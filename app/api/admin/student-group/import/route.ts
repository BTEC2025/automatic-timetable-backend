import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import StudentGroup from "@/app/model/StudentGroupsModel";
import Teacher from "@/app/model/TeacherModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

const CSV_MIME_TYPES = new Set([
    "text/csv",
    "application/vnd.ms-excel",
    "text/plain"
]);

const XLSX_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
]);

type Row = Record<string, unknown>;

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
    return parsed.data.filter((row: any) => Object.keys(row).length);
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

const FIELD_ALIASES = {
    groupId: ["group_id", "groupid", "รหัสกลุ่ม"],
    groupName: ["group_name", "group_nan", "กลุ่มเรียน"],
    studentCount: ["student_count", "student_co", "นักศึกษา"],
    advisor: ["advisor", "advisor_name", "อาจารย์ที่ปรึกษา"]
};

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

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
            if (
                CSV_MIME_TYPES.has(mime) ||
                extension === "csv"
            ) {
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

        const existingGroups = await StudentGroup.find({
            group_id: { $in: rows.map((row) => pick(row, FIELD_ALIASES.groupId)) }
        })
            .select("group_id")
            .lean();
        const existingSet = new Set(existingGroups.map((g) => g.group_id));

        const advisorCache = new Map<string, string | null>();

        async function resolveAdvisor(name: string) {
            const normalized = normalizeKey(name);
            if (!normalized) return null;
            if (advisorCache.has(normalized)) {
                return advisorCache.get(normalized) ?? null;
            }

            const candidates = name
                .split("/")
                .map((part) => part.trim())
                .filter(Boolean);

            for (const candidate of candidates) {
                const teacher = await Teacher.findOne({
                    teacher_name: { $regex: `^${escapeRegExp(candidate)}$`, $options: "i" }
                })
                    .select("_id")
                    .lean();
                if (teacher?._id) {
                    advisorCache.set(normalizeKey(candidate), teacher._id.toString());
                    return teacher._id.toString();
                }
            }

            advisorCache.set(normalized, null);
            return null;
        }

        const result = {
            addedCount: 0,
            failedCount: 0,
            errors: [] as Array<{ row?: number; reason: string }>
        };

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            try {
                const groupId = pick(row, FIELD_ALIASES.groupId);
                const groupName = pick(row, FIELD_ALIASES.groupName);
                const studentCountRaw = pick(row, FIELD_ALIASES.studentCount);
                const advisorName = pick(row, FIELD_ALIASES.advisor);

                if (!groupId || !groupName) {
                    throw new Error("group_id and group_name are required");
                }

                if (existingSet.has(groupId)) {
                    throw new Error(`Group ${groupId} already exists`);
                }

                const studentCount = studentCountRaw ? Number(studentCountRaw) : 0;
                if (Number.isNaN(studentCount)) {
                    throw new Error("student_count must be a number");
                }

                let advisorId: string | null = null;
                if (advisorName) {
                    advisorId = await resolveAdvisor(advisorName);
                }

                await StudentGroup.create({
                    group_id: groupId,
                    group_name: groupName,
                    student_count: studentCount,
                    advisor: advisorId
                });

                existingSet.add(groupId);
                result.addedCount += 1;
            } catch (err) {
                result.failedCount += 1;
                result.errors.push({
                    row: index + 2, // account for header row
                    reason: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("IMPORT STUDENT GROUP ERROR:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return jsonError("Invalid token", 401);
        }
        return jsonError("Internal Server Error", 500);
    }
}
