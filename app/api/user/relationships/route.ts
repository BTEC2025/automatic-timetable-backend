import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/app/model/UserModel";
import Student from "@/app/model/StudentModel";
import Teacher from "@/app/model/TeacherModel";
import StudentGroup from "@/app/model/StudentGroupsModel";

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

    const user = await User.findById(auth.decoded.id).lean();
    if (!user) {
        return jsonError("User not found", 404);
    }

    if (user.role === "student" && user.studentId) {
        const student = await Student.findById(user.studentId).lean();
        if (!student) {
            return jsonError("Student profile not found", 404);
        }

        const group = student.groupId ? await StudentGroup.findById(student.groupId).lean() : null;
        let advisor = null;
        let classmates: Array<{ id: string; student_id: string; student_name: string }> = [];

        if (group) {
            if (group.advisor) {
                const advisorDoc = await Teacher.findById(group.advisor).lean();
                advisor = advisorDoc
                    ? {
                          id: advisorDoc._id.toString(),
                          teacher_id: advisorDoc.teacher_id,
                          teacher_name: advisorDoc.teacher_name
                      }
                    : null;
            }

            const peers = await Student.find({ groupId: group._id }).lean();
            classmates = peers
                .filter((peer) => peer._id.toString() !== student._id.toString())
                .map((peer) => ({
                    id: peer._id.toString(),
                    student_id: peer.student_id,
                    student_name: peer.student_name
                }));
        }

        return NextResponse.json({
            success: true,
            data: {
                role: "student",
                group: group
                    ? {
                          id: group._id.toString(),
                          group_id: group.group_id,
                          group_name: group.group_name
                      }
                    : null,
                advisor,
                classmates
            }
        });
    }

    if (user.role === "teacher" && user.teacherId) {
        const teacher = await Teacher.findById(user.teacherId).lean();
        if (!teacher) {
            return jsonError("Teacher profile not found", 404);
        }

        const advisorGroups = await StudentGroup.find({ advisor: teacher._id }).lean();
        const groupIds = advisorGroups.map((group) => group._id);
        const students = await Student.find({ groupId: { $in: groupIds } }).lean();

        return NextResponse.json({
            success: true,
            data: {
                role: "teacher",
                advisorGroups: advisorGroups.map((group) => ({
                    id: group._id.toString(),
                    group_id: group.group_id,
                    group_name: group.group_name,
                    students: students
                        .filter((student) => student.groupId?.toString() === group._id.toString())
                        .map((student) => ({
                            id: student._id.toString(),
                            student_id: student.student_id,
                            student_name: student.student_name
                        }))
                }))
            }
        });
    }

    return NextResponse.json({
        success: true,
        data: { role: user.role, message: "No additional relationships for this role" }
    });
}
