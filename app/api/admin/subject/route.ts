import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Subject from "@/app/model/SubjectModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type AuthPayload = jwt.JwtPayload & { id: string; role: string };

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

function requireAdmin(req: Request) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
        return { error: jsonError("Unauthorized", 401) };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    let decoded: AuthPayload;

    try {
        decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
        return { error: jsonError("Invalid token", 401) };
    }

    if (decoded.role !== "admin") {
        return { error: jsonError("Forbidden", 403) };
    }

    return { payload: decoded };
}

function toNumber(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search")?.trim();

        const regex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;

        const filter = regex
            ? {
                  $or: [{ subject_id: regex }, { subject_name: regex }]
              }
            : {};

        const subjects = await Subject.find(filter).sort({ subject_id: 1 });

        return NextResponse.json({
            success: true,
            data: subjects.map((subject) => ({
                id: subject._id.toString(),
                subject_id: subject.subject_id,
                subject_name: subject.subject_name,
                theory: subject.theory,
                practice: subject.practice,
                credit: subject.credit
            }))
        });
    } catch (err) {
        console.error("LIST SUBJECT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const subjectId = typeof body.subject_id === "string" ? body.subject_id.trim() : "";
        const subjectName = typeof body.subject_name === "string" ? body.subject_name.trim() : "";
        const theory = toNumber(body.theory);
        const practice = toNumber(body.practice);
        const credit = toNumber(body.credit);

        if (!subjectId || !subjectName) {
            return jsonError("subject_id and subject_name are required", 400);
        }

        if (theory === null || practice === null || credit === null) {
            return jsonError("theory, practice, and credit must be numbers", 400);
        }

        const existing = await Subject.findOne({ subject_id: subjectId });
        if (existing) {
            return jsonError("subject_id already exists", 409);
        }

        const subject = await Subject.create({
            subject_id: subjectId,
            subject_name: subjectName,
            theory,
            practice,
            credit
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: subject._id.toString(),
                    subject_id: subject.subject_id,
                    subject_name: subject.subject_name,
                    theory: subject.theory,
                    practice: subject.practice,
                    credit: subject.credit
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE SUBJECT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function PUT(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return jsonError("Subject id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const subjectId = typeof body.subject_id === "string" ? body.subject_id.trim() : undefined;
        const subjectName = typeof body.subject_name === "string" ? body.subject_name.trim() : undefined;
        const theory = body.theory !== undefined ? toNumber(body.theory) : undefined;
        const practice = body.practice !== undefined ? toNumber(body.practice) : undefined;
        const credit = body.credit !== undefined ? toNumber(body.credit) : undefined;

        if (
            subjectId === undefined &&
            subjectName === undefined &&
            theory === undefined &&
            practice === undefined &&
            credit === undefined
        ) {
            return jsonError("Nothing to update", 400);
        }

        if (
            (theory !== undefined && theory === null) ||
            (practice !== undefined && practice === null) ||
            (credit !== undefined && credit === null)
        ) {
            return jsonError("theory, practice, and credit must be numbers", 400);
        }

        if (subjectId) {
            const duplicate = await Subject.findOne({ _id: { $ne: id }, subject_id: subjectId });
            if (duplicate) {
                return jsonError("subject_id already exists", 409);
            }
        }

        const update: Record<string, unknown> = {};
        if (subjectId) update.subject_id = subjectId;
        if (subjectName) update.subject_name = subjectName;
        if (theory !== undefined) update.theory = theory;
        if (practice !== undefined) update.practice = practice;
        if (credit !== undefined) update.credit = credit;

        const subject = await Subject.findByIdAndUpdate(id, update, { new: true });

        if (!subject) {
            return jsonError("Subject not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: subject._id.toString(),
                subject_id: subject.subject_id,
                subject_name: subject.subject_name,
                theory: subject.theory,
                practice: subject.practice,
                credit: subject.credit
            }
        });
    } catch (err) {
        console.error("UPDATE SUBJECT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return jsonError("Subject id is required", 400);
        }

        const deleted = await Subject.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Subject not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Subject deleted"
        });
    } catch (err) {
        console.error("DELETE SUBJECT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
