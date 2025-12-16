import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Student from "@/app/model/StudentModel";
import StudentGroup from "@/app/model/StudentGroupsModel";
import User from "@/app/model/UserModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type Row = Record<string, unknown>;

const CSV_MIME_TYPES = new Set(["text/csv", "application/vnd.ms-excel", "text/plain"]);
const XLSX_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
]);

const FIELD_ALIASES = {
    studentId: ["student_id", "รหัสนักศึกษา", "studentid"],
    studentName: ["student_name", "ชื่อนักศึกษา", "name"],
    groupId: ["group_id", "รหัสกลุ่ม", "classroom"],
    username: ["username", "user", "บัญชีผู้ใช้"],
    password: ["password", "รหัสผ่าน"]
};

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

function requireAdmin(req: Request) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
        return { error: jsonError("Unauthorized", 401) };
    }

    try {
        const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET) as { role?: string };
        if (!decoded || decoded.role !== "admin") {
            return { error: jsonError("Forbidden", 403) };
        }
        return {};
    } catch {
        return { error: jsonError("Invalid token", 401) };
    }
}

function parseCSV(buffer: Buffer) {
    const text = buffer.toString("utf-8");
    const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
        throw new Error(parsed.errors[0].message);
    }
    return parsed.data.filter((row) => Object.keys(row).length);
}

function parseXLSX(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    if (!workbook.SheetNames.length) {
        return [];
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}

function normalize(value?: string | null) {
    return (value ?? "").trim();
}

function normalizeKey(value?: string | null) {
    return normalize(value).toLowerCase();
}

function pick(row: Row, keys: string[]) {
    for (const key of keys) {
        const direct = row[key];
        if (direct !== undefined && direct !== null && `${direct}`.trim() !== "") {
            return `${direct}`.trim();
        }
        const normalizedKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(key));
        if (normalizedKey) {
            const value = row[normalizedKey];
            if (value !== undefined && value !== null && `${value}`.trim() !== "") {
                return `${value}`.trim();
            }
        }
    }
    return "";
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const formData = await req.formData().catch(() => null);
        if (!formData) {
            return jsonError("Form data is required", 400);
        }

        const file = formData.get("file");
        if (!(file instanceof File)) {
            return jsonError("File field is required", 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = file.type;
        const extension = file.name.split(".").pop()?.toLowerCase();

        let rows: Row[] = [];

        try {
            if (CSV_MIME_TYPES.has(mime) || extension === "csv") {
                rows = parseCSV(buffer);
            } else if (XLSX_MIME_TYPES.has(mime) || extension === "xlsx" || extension === "xls") {
                rows = parseXLSX(buffer);
            } else {
                return jsonError("Unsupported file format. Please upload CSV or XLSX", 400);
            }
        } catch (err) {
            return jsonError(`Failed to parse file: ${(err as Error).message}`, 400);
        }

        if (!rows.length) {
            return jsonError("File has no rows", 400);
        }

        const studentIds = rows.map((row) => pick(row, FIELD_ALIASES.studentId)).filter(Boolean);
        const usernames = rows.map((row) => pick(row, FIELD_ALIASES.username)).filter(Boolean);
        const groupCodes = Array.from(
            new Set(rows.map((row) => pick(row, FIELD_ALIASES.groupId)).filter(Boolean))
        );

        const [existingStudents, existingUsers, groups] = await Promise.all([
            Student.find({ student_id: { $in: studentIds } }).select("student_id").lean(),
            User.find({ username: { $in: usernames } }).select("username").lean(),
            StudentGroup.find({ group_id: { $in: groupCodes } }).select("_id group_id").lean()
        ]);

        const existingStudentSet = new Set(existingStudents.map((s) => s.student_id));
        const existingUsernameSet = new Set(existingUsers.map((u) => u.username));
        const groupMap = new Map(groups.map((group) => [group.group_id, group._id.toString()]));

        const result = {
            addedCount: 0,
            failedCount: 0,
            errors: [] as Array<{ row: number; reason: string }>
        };

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            let createdStudentId: string | null = null;
            try {
                const studentId = pick(row, FIELD_ALIASES.studentId);
                const studentName = pick(row, FIELD_ALIASES.studentName);
                const groupCode = pick(row, FIELD_ALIASES.groupId);
                const username = pick(row, FIELD_ALIASES.username);
                const password = pick(row, FIELD_ALIASES.password);

                if (!studentId || !studentName || !groupCode) {
                    throw new Error("student_id, student_name, and group_id are required");
                }

                if (!username || !password) {
                    throw new Error("username and password are required");
                }

                if (existingStudentSet.has(studentId)) {
                    throw new Error(`Student ${studentId} already exists`);
                }

                if (existingUsernameSet.has(username)) {
                    throw new Error(`Username ${username} already exists`);
                }

                const groupObjectId = groupMap.get(groupCode);
                if (!groupObjectId) {
                    throw new Error(`Group ${groupCode} not found`);
                }

                const student = await Student.create({
                    student_id: studentId,
                    student_name: studentName,
                    groupId: groupObjectId
                });
                createdStudentId = student._id.toString();

                const passwordHash = await bcrypt.hash(password, 10);

                await User.create({
                    username,
                    passwordHash,
                    role: "student",
                    studentId: student._id,
                    status: "active"
                });

                existingStudentSet.add(studentId);
                existingUsernameSet.add(username);
                result.addedCount += 1;
            } catch (err) {
                if (createdStudentId) {
                    await Student.findByIdAndDelete(createdStudentId).catch(() => null);
                }
                result.failedCount += 1;
                result.errors.push({
                    row: index + 2,
                    reason: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error("IMPORT STUDENT ERROR:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return jsonError("Invalid token", 401);
        }
        return jsonError("Internal Server Error", 500);
    }
}
