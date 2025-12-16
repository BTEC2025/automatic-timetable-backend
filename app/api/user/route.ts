import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/app/model/UserModel";
import Student from "@/app/model/StudentModel";
import Teacher from "@/app/model/TeacherModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type AuthPayload = jwt.JwtPayload & { id: string; role: string };

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

async function authenticate(req: Request) {
    const authHeader = req.headers.get("authorization") ?? "";
    const cookieToken = req.headers.get("cookie")?.match(/authToken=([^;]+)/)?.[1];
    const rawToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : cookieToken;
    if (!rawToken) {
        return { error: jsonError("Unauthorized", 401) };
    }

    try {
        const decoded = jwt.verify(rawToken, JWT_SECRET) as AuthPayload;
        if (!decoded?.id) {
            return { error: jsonError("Invalid token", 401) };
        }
        return { decoded };
    } catch {
        return { error: jsonError("Invalid token", 401) };
    }
}

export async function GET(req: Request) {
    await dbConnect();

    const auth = await authenticate(req);
    if (auth.error) return auth.error;

    const user = await User.findById(auth.decoded.id)
        .lean()
        .catch(() => null);

    if (!user) {
        return jsonError("User not found", 404);
    }

    const base: Record<string, unknown> = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        status: user.status
    };

    if (user.role === "student" && user.studentId) {
        const student = await Student.findById(user.studentId).lean();
        if (student) {
            base.student = {
                id: student._id.toString(),
                student_id: student.student_id,
                student_name: student.student_name
            };
        }
    }

    if (user.role === "teacher" && user.teacherId) {
        const teacher = await Teacher.findById(user.teacherId).lean();
        if (teacher) {
            base.teacher = {
                id: teacher._id.toString(),
                teacher_id: teacher.teacher_id,
                teacher_name: teacher.teacher_name,
                role: teacher.role
            };
        }
    }

    return NextResponse.json({ success: true, data: base });
}
