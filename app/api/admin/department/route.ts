import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Department from "@/app/model/DepartmentModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type AuthPayload = jwt.JwtPayload & { id: string; role: string };

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

function requireAdmin(req: Request): { payload?: AuthPayload; error?: NextResponse } {
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
        const search = searchParams.get("search")?.trim();

        const filter = search
            ? {
                  department_name: {
                      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                      $options: "i"
                  }
              }
            : {};

        const departments = await Department.find(filter).sort({ department_name: 1 });
        return NextResponse.json({
            success: true,
            data: departments.map((dept) => ({
                id: dept._id.toString(),
                department_name: dept.department_name
            }))
        });
    } catch (err) {
        console.error("LIST DEPARTMENT ERROR:", err);
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

        const name =
            typeof body.department_name === "string" ? body.department_name.trim() : "";

        if (!name) {
            return jsonError("department_name is required", 400);
        }

        const exists = await Department.findOne({
            department_name: { $regex: `^${name}$`, $options: "i" }
        });
        if (exists) {
            return jsonError("Department already exists", 409);
        }

        const department = await Department.create({ department_name: name });
        return NextResponse.json(
            {
                success: true,
                data: {
                    id: department._id.toString(),
                    department_name: department.department_name
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE DEPARTMENT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function PUT(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("id");
        if (!departmentId) {
            return jsonError("Department id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const name =
            typeof body.department_name === "string" ? body.department_name.trim() : "";

        if (!name) {
            return jsonError("department_name is required", 400);
        }

        const duplicate = await Department.findOne({
            _id: { $ne: departmentId },
            department_name: { $regex: `^${name}$`, $options: "i" }
        });
        if (duplicate) {
            return jsonError("Another department with this name already exists", 409);
        }

        const department = await Department.findByIdAndUpdate(
            departmentId,
            { department_name: name },
            { new: true }
        );

        if (!department) {
            return jsonError("Department not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: department._id.toString(),
                department_name: department.department_name
            }
        });
    } catch (err) {
        console.error("UPDATE DEPARTMENT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const authResult = requireAdmin(req);
        if (authResult.error) return authResult.error;

        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("id");

        if (!departmentId) {
            return jsonError("Department id is required", 400);
        }

        const deleted = await Department.findByIdAndDelete(departmentId);
        if (!deleted) {
            return jsonError("Department not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Department deleted"
        });
    } catch (err) {
        console.error("DELETE DEPARTMENT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
