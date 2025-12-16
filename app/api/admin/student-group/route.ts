import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import StudentGroup from "@/app/model/StudentGroupsModel";

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
        const department = searchParams.get("department");
        const yearlevel = searchParams.get("yearlevel");

        const query: Record<string, unknown> = {};

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            query.$or = [{ group_id: regex }, { group_name: regex }];
        }

        if (department) query.department = department;
        if (yearlevel) query.yearlevel = yearlevel;

        const groups = await StudentGroup.find(query)
            .populate("department", "department_name")
            .populate("yearlevel", "level_name")
            .populate("advisor", "teacher_name")
            .sort({ group_id: 1 });

        return NextResponse.json({
            success: true,
            data: groups.map((group) => ({
                id: group._id.toString(),
                group_id: group.group_id,
                group_name: group.group_name,
                student_count: group.student_count,
                department: group.department
                    ? {
                          id: group.department._id?.toString?.() ?? group.department.toString(),
                          name: (group.department as any).department_name ?? null
                      }
                    : null,
                yearlevel: group.yearlevel
                    ? {
                          id: group.yearlevel._id?.toString?.() ?? group.yearlevel.toString(),
                          name: (group.yearlevel as any).level_name ?? null
                      }
                    : null,
                advisor: group.advisor
                    ? {
                          id: group.advisor._id?.toString?.() ?? group.advisor.toString(),
                          name: (group.advisor as any).teacher_name ?? null
                      }
                    : null
            }))
        });
    } catch (err) {
        console.error("LIST STUDENT GROUP ERROR:", err);
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

        const groupId = typeof body.group_id === "string" ? body.group_id.trim() : "";
        const groupName = typeof body.group_name === "string" ? body.group_name.trim() : "";
        const studentCount = toNumber(body.student_count);
        const department = typeof body.department === "string" ? body.department.trim() : undefined;
        const yearlevel = typeof body.yearlevel === "string" ? body.yearlevel.trim() : undefined;
        const advisor = typeof body.advisor === "string" ? body.advisor.trim() : undefined;

        if (!groupId || !groupName) {
            return jsonError("group_id and group_name are required", 400);
        }

        if (studentCount === null) {
            return jsonError("student_count must be a number", 400);
        }

        const existing = await StudentGroup.findOne({ group_id: groupId });
        if (existing) {
            return jsonError("group_id already exists", 409);
        }

        const group = await StudentGroup.create({
            group_id: groupId,
            group_name: groupName,
            student_count: studentCount ?? 0,
            department: department || undefined,
            yearlevel: yearlevel || undefined,
            advisor: advisor || undefined
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: group._id.toString(),
                    group_id: group.group_id,
                    group_name: group.group_name,
                    student_count: group.student_count,
                    department: group.department ? group.department.toString() : null,
                    yearlevel: group.yearlevel ? group.yearlevel.toString() : null,
                    advisor: group.advisor ? group.advisor.toString() : null
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE STUDENT GROUP ERROR:", err);
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
            return jsonError("Group id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const groupId = typeof body.group_id === "string" ? body.group_id.trim() : undefined;
        const groupName = typeof body.group_name === "string" ? body.group_name.trim() : undefined;
        const studentCount = body.student_count !== undefined ? toNumber(body.student_count) : undefined;
        const department = body.department === null ? null : typeof body.department === "string" ? body.department.trim() : undefined;
        const yearlevel = body.yearlevel === null ? null : typeof body.yearlevel === "string" ? body.yearlevel.trim() : undefined;
        const advisor = body.advisor === null ? null : typeof body.advisor === "string" ? body.advisor.trim() : undefined;

        if (studentCount !== undefined && studentCount === null) {
            return jsonError("student_count must be a number", 400);
        }

        if (
            groupId === undefined &&
            groupName === undefined &&
            studentCount === undefined &&
            department === undefined &&
            yearlevel === undefined &&
            advisor === undefined
        ) {
            return jsonError("Nothing to update", 400);
        }

        if (groupId) {
            const duplicate = await StudentGroup.findOne({ _id: { $ne: id }, group_id: groupId });
            if (duplicate) {
                return jsonError("group_id already exists", 409);
            }
        }

        const update: Record<string, unknown> = {};
        if (groupId) update.group_id = groupId;
        if (groupName) update.group_name = groupName;
        if (studentCount !== undefined) update.student_count = studentCount;
        if (department !== undefined) update.department = department;
        if (yearlevel !== undefined) update.yearlevel = yearlevel;
        if (advisor !== undefined) update.advisor = advisor;

        const group = await StudentGroup.findByIdAndUpdate(id, update, { new: true });
        if (!group) {
            return jsonError("Group not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: group._id.toString(),
                group_id: group.group_id,
                group_name: group.group_name,
                student_count: group.student_count,
                department: group.department ? group.department.toString() : null,
                yearlevel: group.yearlevel ? group.yearlevel.toString() : null,
                advisor: group.advisor ? group.advisor.toString() : null
            }
        });
    } catch (err) {
        console.error("UPDATE STUDENT GROUP ERROR:", err);
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
            return jsonError("Group id is required", 400);
        }

        const deleted = await StudentGroup.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Group not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Group deleted"
        });
    } catch (err) {
        console.error("DELETE STUDENT GROUP ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
