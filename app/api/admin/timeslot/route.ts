import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Timeslot from "@/app/model/TimeslotModel";

const JWT_SECRET = process.env.JWT_SECRET || "";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

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
        const dayParam = searchParams.get("day");
        const search = searchParams.get("search")?.trim();

        const filter: Record<string, unknown> = {};
        if (dayParam && DAYS.includes(dayParam as (typeof DAYS)[number])) {
            filter.day = dayParam;
        }

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [
                { period: regex },
                { start: regex },
                { end: regex }
            ];
        }

        const timeslots = await Timeslot.find(filter).sort({ day: 1, period: 1 });

        return NextResponse.json({
            success: true,
            data: timeslots.map((slot) => ({
                id: slot._id.toString(),
                day: slot.day,
                period: slot.period,
                start: slot.start,
                end: slot.end
            }))
        });
    } catch (err) {
        console.error("LIST TIMESLOT ERROR:", err);
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

        const day = typeof body.day === "string" ? body.day.trim() : "";
        const period = typeof body.period === "string" ? body.period.trim() : "";
        const start = typeof body.start === "string" ? body.start.trim() : "";
        const end = typeof body.end === "string" ? body.end.trim() : "";

        if (!day || !period || !start || !end) {
            return jsonError("day, period, start, and end are required", 400);
        }

        if (!DAYS.includes(day as (typeof DAYS)[number])) {
            return jsonError("day must be Mon, Tue, Wed, Thu, or Fri", 400);
        }

        const duplicate = await Timeslot.findOne({ day, period });
        if (duplicate) {
            return jsonError("Timeslot already exists for this day and period", 409);
        }

        const timeslot = await Timeslot.create({ day, period, start, end });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: timeslot._id.toString(),
                    day: timeslot.day,
                    period: timeslot.period,
                    start: timeslot.start,
                    end: timeslot.end
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("CREATE TIMESLOT ERROR:", err);
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
            return jsonError("Timeslot id is required", 400);
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return jsonError("Invalid JSON body", 400);
        }

        const day = typeof body.day === "string" ? body.day.trim() : undefined;
        const period = typeof body.period === "string" ? body.period.trim() : undefined;
        const start = typeof body.start === "string" ? body.start.trim() : undefined;
        const end = typeof body.end === "string" ? body.end.trim() : undefined;

        if (day && !DAYS.includes(day as (typeof DAYS)[number])) {
            return jsonError("day must be Mon, Tue, Wed, Thu, or Fri", 400);
        }

        if (!day && !period && !start && !end) {
            return jsonError("Nothing to update", 400);
        }

        if ((day || period) && (day ?? period)) {
            const current = await Timeslot.findById(id);
            if (!current) {
                return jsonError("Timeslot not found", 404);
            }
            const newDay = day ?? current.day;
            const newPeriod = period ?? current.period;

            const duplicate = await Timeslot.findOne({
                _id: { $ne: id },
                day: newDay,
                period: newPeriod
            });
            if (duplicate) {
                return jsonError("Another timeslot already uses this day and period", 409);
            }
        }

        const update: Record<string, unknown> = {};
        if (day) update.day = day;
        if (period) update.period = period;
        if (start) update.start = start;
        if (end) update.end = end;

        const timeslot = await Timeslot.findByIdAndUpdate(id, update, { new: true });
        if (!timeslot) {
            return jsonError("Timeslot not found", 404);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: timeslot._id.toString(),
                day: timeslot.day,
                period: timeslot.period,
                start: timeslot.start,
                end: timeslot.end
            }
        });
    } catch (err) {
        console.error("UPDATE TIMESLOT ERROR:", err);
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
            return jsonError("Timeslot id is required", 400);
        }

        const deleted = await Timeslot.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError("Timeslot not found", 404);
        }

        return NextResponse.json({
            success: true,
            message: "Timeslot deleted"
        });
    } catch (err) {
        console.error("DELETE TIMESLOT ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
