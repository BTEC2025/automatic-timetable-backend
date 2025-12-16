import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import Teacher from "@/app/model/TeacherModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type Row = Record<string, unknown>;

const CSV_MIME_TYPES = new Set([
    "text/csv",
    "application/vnd.ms-excel",
    "text/plain"
]);

const XLSX_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
]);

const FIELD_ALIASES = {
    teacherId: ["teacher_id", "รหัสครู", "รหัสอาจารย์"],
    teacherName: ["teacher_name", "ชื่ออาจารย์", "ชื่อครู"],
    role: ["role", "ตำแหน่ง", "บทบาท"]
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
        const normalizedKey = Object.keys(row).find(
            (k) => normalizeKey(k) === normalizeKey(key)
        );
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

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mime = file.type;
        const extension = file.name.split(".").pop()?.toLowerCase();

        let rows: Row[] = [];
        try {
            if (CSV_MIME_TYPES.has(mime) || extension === "csv") {
                rows = parseCSV(buffer);
            } else if (
                XLSX_MIME_TYPES.has(mime) ||
                extension === "xlsx" ||
                extension === "xls"
            ) {
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

        const teacherIds = rows.map((row) => pick(row, FIELD_ALIASES.teacherId)).filter(Boolean);
        const existing = await Teacher.find({ teacher_id: { $in: teacherIds } })
            .select("teacher_id")
            .lean();
        const existingSet = new Set(existing.map((t) => t.teacher_id));

        const result = {
            addedCount: 0,
            failedCount: 0,
            errors: [] as Array<{ row?: number; reason: string }>
        };

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            try {
                const teacherId = pick(row, FIELD_ALIASES.teacherId);
                const teacherName = pick(row, FIELD_ALIASES.teacherName);
                const roleRaw = pick(row, FIELD_ALIASES.role).toLowerCase();
                const role: "leader" | "teacher" =
                    roleRaw === "leader" || roleRaw === "หัวหน้า" ? "leader" : "teacher";

                if (!teacherId || !teacherName) {
                    throw new Error("teacher_id and teacher_name are required");
                }

                if (existingSet.has(teacherId)) {
                    throw new Error(`Teacher ${teacherId} already exists`);
                }

                await Teacher.create({
                    teacher_id: teacherId,
                    teacher_name: teacherName,
                    role
                });

                existingSet.add(teacherId);
                result.addedCount += 1;
            } catch (err) {
                result.failedCount += 1;
                result.errors.push({
                    row: index + 2,
                    reason: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("IMPORT TEACHER ERROR:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return jsonError("Invalid token", 401);
        }
        return jsonError("Internal Server Error", 500);
    }
}
