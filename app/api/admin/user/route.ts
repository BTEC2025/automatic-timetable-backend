import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User, { UserRole } from "@/app/model/UserModel";
import Student from "@/app/model/StudentModel";
import Teacher from "@/app/model/TeacherModel";

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

const ALLOWED_ROLES: UserRole[] = ["admin", "teacher", "student"];
const USER_STATUSES = ["active", "inactive", "deleted"] as const;

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

export async function GET(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 100);
        const roleFilter = searchParams.get("role");
        const statusFilter = searchParams.get("status");
        const search = searchParams.get("search")?.trim();

        const query: Record<string, unknown> = {};

        if (roleFilter && ALLOWED_ROLES.includes(roleFilter as UserRole)) {
            query.role = roleFilter;
        }

        if (statusFilter && USER_STATUSES.includes(statusFilter as (typeof USER_STATUSES)[number])) {
            query.status = statusFilter;
        }

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            query.username = regex;
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ username: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            data: users.map((user) => ({
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                status: user.status,
                studentId: user.studentId ? user.studentId.toString() : null,
                teacherId: user.teacherId ? user.teacherId.toString() : null
            })),
            pagination: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
                hasMore: skip + users.length < total
            }
        });
    } catch (err) {
        console.error("LIST USER ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const username = typeof body.username === "string" ? body.username.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const role = typeof body.role === "string" ? (body.role as UserRole) : "";
        const statusInput = typeof body.status === "string" ? body.status : "";
        const status = USER_STATUSES.includes(statusInput as (typeof USER_STATUSES)[number])
            ? (statusInput as (typeof USER_STATUSES)[number])
            : "active";

        if (!username || !password || !role) {
            return jsonError("username, password, and role are required", 400);
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return jsonError("Invalid role", 400);
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return jsonError("Username already exists", 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let studentId: string | null = null;
        let teacherId: string | null = null;

        if (role === "student") {
            if (typeof body.studentId === "string" && body.studentId.trim()) {
                studentId = body.studentId.trim();
            } else {
                const studentPayload = body.student ?? {};
                const studentCode =
                    typeof studentPayload.student_id === "string"
                        ? studentPayload.student_id.trim()
                        : "";
                const studentName =
                    typeof studentPayload.student_name === "string"
                        ? studentPayload.student_name.trim()
                        : "";
                const groupId =
                    typeof studentPayload.groupId === "string" ? studentPayload.groupId.trim() : "";

                if (!studentCode || !studentName || !groupId) {
                    return jsonError("Student info is incomplete", 400);
                }

                const createdStudent = await Student.create({
                    student_id: studentCode,
                    student_name: studentName,
                    groupId
                });
                studentId = createdStudent._id.toString();
            }
        }

        if (role === "teacher") {
            if (typeof body.teacherId === "string" && body.teacherId.trim()) {
                teacherId = body.teacherId.trim();
            } else {
                const teacherPayload = body.teacher ?? {};
                const teacherCode =
                    typeof teacherPayload.teacher_id === "string"
                        ? teacherPayload.teacher_id.trim()
                        : "";
                const teacherName =
                    typeof teacherPayload.teacher_name === "string"
                        ? teacherPayload.teacher_name.trim()
                        : "";
                const department =
                    typeof teacherPayload.department === "string"
                        ? teacherPayload.department.trim()
                        : undefined;
                const teacherRole: "leader" | "teacher" =
                    teacherPayload.role === "leader" ? "leader" : "teacher";
                const maxHours =
                    typeof teacherPayload.max_hours_per_week === "number"
                        ? teacherPayload.max_hours_per_week
                        : undefined;

                if (!teacherCode || !teacherName) {
                    return jsonError("Teacher info is incomplete", 400);
                }

                const createdTeacher = await Teacher.create({
                    teacher_id: teacherCode,
                    teacher_name: teacherName,
                    department,
                    role: teacherRole,
                    max_hours_per_week: maxHours
                });
                teacherId = createdTeacher._id.toString();
            }
        }

        const newUser = await User.create({
            username,
            passwordHash,
            role,
            status,
            studentId,
            teacherId
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: newUser._id.toString(),
                    username: newUser.username,
                    role: newUser.role,
                    status: newUser.status,
                    studentId: newUser.studentId ? newUser.studentId.toString() : null,
                    teacherId: newUser.teacherId ? newUser.teacherId.toString() : null
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("ADD USER ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return jsonError("User id is required", 400);
        }

        const user = await User.findById(userId);
        if (!user) {
            return jsonError("User not found", 404);
        }

        if (user.status === "inactive") {
            return NextResponse.json({
                success: true,
                message: "User already inactive"
            });
        }

        user.status = "inactive";
        await user.save();

        return NextResponse.json({
            success: true,
            message: "User marked as inactive",
            data: {
                id: user._id.toString(),
                status: user.status
            }
        });
    } catch (err) {
        console.error("DELETE USER ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function PUT(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return jsonError("User id is required", 400);
        }

        const user = await User.findById(userId);
        if (!user) {
            return jsonError("User not found", 404);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const username = typeof body.username === "string" ? body.username.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const statusInput = typeof body.status === "string" ? body.status : "";
        const status = USER_STATUSES.includes(statusInput as (typeof USER_STATUSES)[number])
            ? (statusInput as (typeof USER_STATUSES)[number])
            : undefined;
        const roleInput = typeof body.role === "string" ? body.role.trim() : "";

        if (roleInput && roleInput !== user.role) {
            return jsonError("Changing role is not supported via update", 400);
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return jsonError("Username already exists", 409);
            }
            user.username = username;
        }

        if (password) {
            user.passwordHash = await bcrypt.hash(password, 10);
        }

        if (status) {
            user.status = status;
        }

        if (user.role === "student") {
            if (typeof body.studentId === "string" && body.studentId.trim()) {
                user.studentId = body.studentId.trim();
            }

            const studentPayload = body.student;
            if (studentPayload && typeof studentPayload === "object") {
                const studentUpdate: Record<string, unknown> = {};
                if (typeof studentPayload.student_id === "string") {
                    studentUpdate.student_id = studentPayload.student_id.trim();
                }
                if (typeof studentPayload.student_name === "string") {
                    studentUpdate.student_name = studentPayload.student_name.trim();
                }
                if (typeof studentPayload.groupId === "string") {
                    studentUpdate.groupId = studentPayload.groupId.trim();
                }

                if (user.studentId) {
                    await Student.findByIdAndUpdate(
                        user.studentId,
                        studentUpdate,
                        { omitUndefined: true, new: true }
                    );
                } else if (studentUpdate.student_id && studentUpdate.student_name && studentUpdate.groupId) {
                    const createdStudent = await Student.create({
                        student_id: studentUpdate.student_id,
                        student_name: studentUpdate.student_name,
                        groupId: studentUpdate.groupId
                    });
                    user.studentId = createdStudent._id;
                } else if (Object.keys(studentUpdate).length) {
                    return jsonError("Student info is incomplete", 400);
                }
            }
        }

        if (user.role === "teacher") {
            if (typeof body.teacherId === "string" && body.teacherId.trim()) {
                user.teacherId = body.teacherId.trim();
            }

            const teacherPayload = body.teacher;
            if (teacherPayload && typeof teacherPayload === "object") {
                const teacherUpdate: Record<string, unknown> = {};
                if (typeof teacherPayload.teacher_id === "string") {
                    teacherUpdate.teacher_id = teacherPayload.teacher_id.trim();
                }
                if (typeof teacherPayload.teacher_name === "string") {
                    teacherUpdate.teacher_name = teacherPayload.teacher_name.trim();
                }
                if (typeof teacherPayload.department === "string") {
                    teacherUpdate.department = teacherPayload.department.trim();
                }
                if (teacherPayload.role === "leader" || teacherPayload.role === "teacher") {
                    teacherUpdate.role = teacherPayload.role;
                }
                if (typeof teacherPayload.max_hours_per_week === "number") {
                    teacherUpdate.max_hours_per_week = teacherPayload.max_hours_per_week;
                }

                if (user.teacherId) {
                    await Teacher.findByIdAndUpdate(
                        user.teacherId,
                        teacherUpdate,
                        { omitUndefined: true, new: true }
                    );
                } else if (teacherUpdate.teacher_id && teacherUpdate.teacher_name) {
                    const createdTeacher = await Teacher.create({
                        teacher_id: teacherUpdate.teacher_id,
                        teacher_name: teacherUpdate.teacher_name,
                        department: teacherUpdate.department,
                        role: (teacherUpdate.role as "leader" | "teacher") ?? "teacher",
                        max_hours_per_week: teacherUpdate.max_hours_per_week as number | undefined
                    });
                    user.teacherId = createdTeacher._id;
                } else if (Object.keys(teacherUpdate).length) {
                    return jsonError("Teacher info is incomplete", 400);
                }
            }
        }

        await user.save();

        return NextResponse.json({
            success: true,
            data: {
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                status: user.status,
                studentId: user.studentId ? user.studentId.toString() : null,
                teacherId: user.teacherId ? user.teacherId.toString() : null
            }
        });
    } catch (err) {
        console.error("UPDATE USER ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
