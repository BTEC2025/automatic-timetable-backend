import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Register from "@/app/model/RegisterModel";

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

function parseObjectId(value: unknown) {
    const str = typeof value === "string" ? value.trim() : "";
    if (!str || !Types.ObjectId.isValid(str)) {
        return null;
    }
    return new Types.ObjectId(str);
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const groupId = searchParams.get("group_id");
        const subjectId = searchParams.get("subject_id");

        const query: Record<string, unknown> = {};
        if (groupId && Types.ObjectId.isValid(groupId)) {
            query.group_id = groupId;
        }
        if (subjectId && Types.ObjectId.isValid(subjectId)) {
            query.subject_id = subjectId;
        }

        const registers = await Register.find(query)
            .populate("group_id", "group_name group_id")
            .populate("subject_id", "subject_name subject_id")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: registers.map((reg) => ({
                id: reg._id.toString(),
                group: reg.group_id
                    ? {
                          id: reg.group_id._id?.toString?.() ?? reg.group_id.toString(),
                          group_id: (reg.group_id as any).group_id ?? null,
                          group_name: (reg.group_id as any).group_name ?? null
                      }
                    : null,
                subject: reg.subject_id
                    ? {
                          id: reg.subject_id._id?.toString?.() ?? reg.subject_id.toString(),
                          subject_id: (reg.subject_id as any).subject_id ?? null,
                          subject_name: (reg.subject_id as any).subject_name ?? null
                      }
                    : null
            }))
        });
    } catch (err) {
        console.error("LIST REGISTER ERROR:", err);
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

        const groupId = parseObjectId(body.group_id);
        const subjectId = parseObjectId(body.subject_id);

        if (!groupId || !subjectId) {
            return jsonError("group_id and subject_id must be valid ObjectId strings", 400);
        }

        const duplicate = await Register.findOne({ group_id: groupId, subject_id: subjectId });
        if (duplicate) {
            return jsonError("Registration already exists for this group and subject", 409);
        }

        const register = await Register.create({
            group_id: groupId,
            subject_id: subjectId
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: register._id.toString(),
                    group_id: register.group_id.toString(),
                    subject_id: register.subject_id.toString()
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE REGISTER ERROR:", err);
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
            return jsonError("Register id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const groupId = body.group_id !== undefined ? parseObjectId(body.group_id) : undefined;
        const subjectId = body.subject_id !== undefined ? parseObjectId(body.subject_id) : undefined;

        if (groupId === undefined && subjectId === undefined) {
            return jsonError("Nothing to update", 400);
        }

        if ((groupId !== undefined && groupId === null) || (subjectId !== undefined && subjectId === null)) {
            return jsonError("group_id and subject_id must be valid ObjectId strings", 400);
        }

        const register = await Register.findById(id);
        if (!register) {
            return jsonError("Register not found", 404);
        }

        const newGroupId = groupId ?? register.group_id;
        const newSubjectId = subjectId ?? register.subject_id;

        const duplicate = await Register.findOne({
            _id: { $ne: id },
            group_id: newGroupId,
            subject_id: newSubjectId
        });
        if (duplicate) {
            return jsonError("Another register entry already exists for this group and subject", 409);
        }

        register.group_id = newGroupId;
        register.subject_id = newSubjectId;
        await register.save();

        return NextResponse.json({
            success: true,
            data: {
                id: register._id.toString(),
                group_id: register.group_id.toString(),
                subject_id: register.subject_id.toString()
            }
        });
    } catch (err) {
        console.error("UPDATE REGISTER ERROR:", err);
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
            return jsonError("Register id is required", 400);
        }

        const deleted = await Register.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Register not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Register deleted"
        });
    } catch (err) {
        console.error("DELETE REGISTER ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
