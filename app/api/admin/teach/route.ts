import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Teach from "@/app/model/TeachModel";

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

export async function GET(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const teacherId = searchParams.get("teacher_id")?.trim();
        const subjectId = searchParams.get("subject_id")?.trim();

        const query: Record<string, unknown> = {};
        if (teacherId) query.teacher_id = teacherId;
        if (subjectId) query.subject_id = subjectId;

        const teaches = await Teach.find(query).sort({ teacher_id: 1, subject_id: 1 });

        return NextResponse.json({
            success: true,
            data: teaches.map((teach) => ({
                id: teach._id.toString(),
                teacher_id: teach.teacher_id,
                subject_id: teach.subject_id
            }))
        });
    } catch (err) {
        console.error("LIST TEACH ERROR:", err);
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

        const teacherId = typeof body.teacher_id === "string" ? body.teacher_id.trim() : "";
        const subjectId = typeof body.subject_id === "string" ? body.subject_id.trim() : "";

        if (!teacherId || !subjectId) {
            return jsonError("teacher_id and subject_id are required", 400);
        }

        const duplicate = await Teach.findOne({ teacher_id: teacherId, subject_id: subjectId });
        if (duplicate) {
            return jsonError("Teach entry already exists for this teacher and subject", 409);
        }

        const teach = await Teach.create({ teacher_id: teacherId, subject_id: subjectId });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: teach._id.toString(),
                    teacher_id: teach.teacher_id,
                    subject_id: teach.subject_id
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE TEACH ERROR:", err);
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
            return jsonError("Teach id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const teacherId = body.teacher_id !== undefined
            ? typeof body.teacher_id === "string"
                ? body.teacher_id.trim()
                : ""
            : undefined;
        const subjectId = body.subject_id !== undefined
            ? typeof body.subject_id === "string"
                ? body.subject_id.trim()
                : ""
            : undefined;

        if (
            teacherId === undefined &&
            subjectId === undefined
        ) {
            return jsonError("Nothing to update", 400);
        }

        if ((teacherId !== undefined && !teacherId) || (subjectId !== undefined && !subjectId)) {
            return jsonError("teacher_id and subject_id must be non-empty strings", 400);
        }

        const teach = await Teach.findById(id);
        if (!teach) {
            return jsonError("Teach entry not found", 404);
        }

        const newTeacherId = teacherId ?? teach.teacher_id;
        const newSubjectId = subjectId ?? teach.subject_id;

        const duplicate = await Teach.findOne({
            _id: { $ne: id },
            teacher_id: newTeacherId,
            subject_id: newSubjectId
        });
        if (duplicate) {
            return jsonError("Another teach entry already exists for this teacher and subject", 409);
        }

        teach.teacher_id = newTeacherId;
        teach.subject_id = newSubjectId;
        await teach.save();

        return NextResponse.json({
            success: true,
            data: {
                id: teach._id.toString(),
                teacher_id: teach.teacher_id,
                subject_id: teach.subject_id
            }
        });
    } catch (err) {
        console.error("UPDATE TEACH ERROR:", err);
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
            return jsonError("Teach id is required", 400);
        }

        const deleted = await Teach.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Teach entry not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Teach entry deleted"
        });
    } catch (err) {
        console.error("DELETE TEACH ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
