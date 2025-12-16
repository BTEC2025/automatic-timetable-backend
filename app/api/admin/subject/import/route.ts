import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import Subject from "@/app/model/SubjectModel";

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
    subjectId: ["subject_id", "รหัสวิชา", "code"],
    subjectName: ["subject_name", "ชื่อวิชา", "name"],
    theory: ["theory", "บรรยาย"],
    practice: ["practice", "ปฏิบัติ"],
    credit: ["credit", "หน่วยกิต"]
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
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    return parsed.data.filter((row) => Object.keys(row).length);
}

function parseXLSX(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    if (!workbook.SheetNames.length) return [];
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

function parseNumber(value: string) {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const formData = await req.formData().catch(() => null);
        if (!formData) return jsonError("Form data is required", 400);

        const file = formData.get("file");
        if (!(file instanceof File)) return jsonError("File field is required", 400);

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

        if (!rows.length) return jsonError("File has no rows", 400);

        const subjectIds = rows.map((row) => pick(row, FIELD_ALIASES.subjectId)).filter(Boolean);
        const existing = await Subject.find({ subject_id: { $in: subjectIds } }).select("subject_id").lean();
        const existingSet = new Set(existing.map((subject) => subject.subject_id));

        const result = {
            addedCount: 0,
            failedCount: 0,
            errors: [] as Array<{ row: number; reason: string }>
        };

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            try {
                const subjectId = pick(row, FIELD_ALIASES.subjectId);
                const subjectName = pick(row, FIELD_ALIASES.subjectName);
                const theory = parseNumber(pick(row, FIELD_ALIASES.theory) || "");
                const practice = parseNumber(pick(row, FIELD_ALIASES.practice) || "");
                const credit = parseNumber(pick(row, FIELD_ALIASES.credit) || "");

                if (!subjectId || !subjectName) {
                    throw new Error("subject_id and subject_name are required");
                }

                if (theory === null || practice === null || credit === null) {
                    throw new Error("theory, practice, and credit must be numeric");
                }

                if (existingSet.has(subjectId)) {
                    throw new Error(`Subject ${subjectId} already exists`);
                }

                await Subject.create({
                    subject_id: subjectId,
                    subject_name: subjectName,
                    theory,
                    practice,
                    credit
                });

                existingSet.add(subjectId);
                result.addedCount += 1;
            } catch (err) {
                result.failedCount += 1;
                result.errors.push({
                    row: index + 2,
                    reason: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error("IMPORT SUBJECT ERROR:", err);
        if (err instanceof jwt.JsonWebTokenError) return jsonError("Invalid token", 401);
        return jsonError("Internal Server Error", 500);
    }
}
