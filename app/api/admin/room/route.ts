import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/model/RoomModel";

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
                  $or: [
                      { room_id: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
                      { room_name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
                  ]
              }
            : {};

        const rooms = await Room.find(filter).sort({ room_id: 1 });

        return NextResponse.json({
            success: true,
            data: rooms.map((room) => ({
                id: room._id.toString(),
                room_id: room.room_id,
                room_name: room.room_name,
                room_type: room.room_type
            }))
        });
    } catch (err) {
        console.error("LIST ROOM ERROR:", err);
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

        const roomId = typeof body.room_id === "string" ? body.room_id.trim() : "";
        const roomName = typeof body.room_name === "string" ? body.room_name.trim() : "";
        const roomType =
            body.room_type === "practice" || body.room_type === "theory" ? body.room_type : "theory";

        if (!roomId || !roomName) {
            return jsonError("room_id and room_name are required", 400);
        }

        const existing = await Room.findOne({ room_id: roomId });
        if (existing) {
            return jsonError("room_id already exists", 409);
        }

        const room = await Room.create({
            room_id: roomId,
            room_name: roomName,
            room_type: roomType
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: room._id.toString(),
                    room_id: room.room_id,
                    room_name: room.room_name,
                    room_type: room.room_type
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE ROOM ERROR:", err);
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
            return jsonError("Room id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const roomId = typeof body.room_id === "string" ? body.room_id.trim() : undefined;
        const roomName = typeof body.room_name === "string" ? body.room_name.trim() : undefined;
        const roomType =
            body.room_type === "practice" || body.room_type === "theory" ? body.room_type : undefined;

        if (!roomId && !roomName && !roomType) {
            return jsonError("Nothing to update", 400);
        }

        if (roomId) {
            const duplicate = await Room.findOne({ _id: { $ne: id }, room_id: roomId });
            if (duplicate) {
                return jsonError("room_id already exists", 409);
            }
        }

        const room = await Room.findByIdAndUpdate(
            id,
            {
                ...(roomId ? { room_id: roomId } : {}),
                ...(roomName ? { room_name: roomName } : {}),
                ...(roomType ? { room_type: roomType } : {})
            },
            { new: true }
        );

        if (!room) {
            return jsonError("Room not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: room._id.toString(),
                room_id: room.room_id,
                room_name: room.room_name,
                room_type: room.room_type
            }
        });
    } catch (err) {
        console.error("UPDATE ROOM ERROR:", err);
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
            return jsonError("Room id is required", 400);
        }

        const deleted = await Room.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Room not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Room deleted"
        });
    } catch (err) {
        console.error("DELETE ROOM ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
