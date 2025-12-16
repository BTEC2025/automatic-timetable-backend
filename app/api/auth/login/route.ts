// /api/auth/login/route.ts
import dbConnect from "@/lib/mongodb";
import Student from "../../../model/StudentModel";
import User from "../../../model/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const { username, password } = await req.json();
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        // หา user ด้วย username
        const user =
            (await User.findOne({ username })) ||
            (await Student.findOne({ username }));

        if (!user) {
            return NextResponse.json(
                { success: false, message: "ไม่พบผู้ใช้งาน" },
                { status: 401 }
            );
        }

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: "รหัสผ่านไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        // สร้าง JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role || "student"
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        const response = NextResponse.json({
            success: true, token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name || user.st_name,
                role: user.role ?? "student"
            }
        });

        // Secure cookie
        response.cookies.set("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return NextResponse.json(
            { success: false, message: "Server Error" },
            { status: 500 }
        );
    }
}
