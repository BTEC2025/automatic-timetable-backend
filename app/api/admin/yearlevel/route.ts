import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import YearLevel from "@/app/model/YearLevelModel";

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
        const search = searchParams.get("search")?.trim();

        const filter = search
            ? {
                  level_name: {
                      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                      $options: "i"
                  }
              }
            : {};

        const yearLevels = await YearLevel.find(filter).sort({ level_name: 1 });

        return NextResponse.json({
            success: true,
            data: yearLevels.map((level) => ({
                id: level._id.toString(),
                level_name: level.level_name
            }))
        });
    } catch (err) {
        console.error("LIST YEAR LEVEL ERROR:", err);
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

        const levelName = typeof body.level_name === "string" ? body.level_name.trim() : "";

        if (!levelName) {
            return jsonError("level_name is required", 400);
        }

        const exists = await YearLevel.findOne({
            level_name: { $regex: `^${levelName}$`, $options: "i" }
        });
        if (exists) {
            return jsonError("Year level already exists", 409);
        }

        const yearLevel = await YearLevel.create({ level_name: levelName });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: yearLevel._id.toString(),
                    level_name: yearLevel.level_name
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE YEAR LEVEL ERROR:", err);
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
            return jsonError("Year level id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const levelName = typeof body.level_name === "string" ? body.level_name.trim() : "";
        if (!levelName) {
            return jsonError("level_name is required", 400);
        }

        const duplicate = await YearLevel.findOne({
            _id: { $ne: id },
            level_name: { $regex: `^${levelName}$`, $options: "i" }
        });
        if (duplicate) {
            return jsonError("Another year level already uses this name", 409);
        }

        const yearLevel = await YearLevel.findByIdAndUpdate(
            id,
            { level_name: levelName },
            { new: true }
        );

        if (!yearLevel) {
            return jsonError("Year level not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: yearLevel._id.toString(),
                level_name: yearLevel.level_name
            }
        });
    } catch (err) {
        console.error("UPDATE YEAR LEVEL ERROR:", err);
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
            return jsonError("Year level id is required", 400);
        }

        const deleted = await YearLevel.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Year level not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Year level deleted"
        });
    } catch (err) {
        console.error("DELETE YEAR LEVEL ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
