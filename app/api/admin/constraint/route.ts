import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Constraint from "@/app/model/ConstraintModel";

const JWT_SECRET = process.env.JWT_SECRET || "";
const PRIORITIES = ["hard", "soft"] as const;
const TARGETS = ["teacher", "studentGroup", "department", "room", "yearLevel", "global"] as const;
const RULES = ["UNAVAILABLE", "REQUIRED_SLOT", "BLOCKED_SLOT", "CUSTOM"] as const;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type AuthPayload = jwt.JwtPayload & { id: string; role: string };

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

async function requireAdmin(req: Request) {
    await dbConnect();

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
        return { error: jsonError("Unauthorized", 401) };
    }

    try {
        const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET) as AuthPayload;
        if (!decoded || decoded.role !== "admin") {
            return { error: jsonError("Forbidden", 403) };
        }
        return { decoded };
    } catch {
        return { error: jsonError("Invalid token", 401) };
    }
}

export async function GET(req: Request) {
    const authCheck = await requireAdmin(req);
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 100);
    const targetType = searchParams.get("targetType");
    const ruleType = searchParams.get("ruleType");
    const priority = searchParams.get("priority");

    const query: Record<string, unknown> = {};
    if (targetType && TARGETS.includes(targetType as typeof TARGETS[number])) {
        query.targetType = targetType;
    }
    if (ruleType && RULES.includes(ruleType as typeof RULES[number])) {
        query.ruleType = ruleType;
    }
    if (priority && PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
        query.priority = priority;
    }

    const skip = (page - 1) * limit;

    const [constraints, total] = await Promise.all([
        Constraint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Constraint.countDocuments(query)
    ]);

    return NextResponse.json({
        success: true,
        data: constraints.map((doc) => ({
            id: doc._id.toString(),
            targetType: doc.targetType,
            targetId: doc.targetId ? doc.targetId.toString() : null,
            ruleType: doc.ruleType,
            payload: doc.payload,
            priority: doc.priority,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        })),
        pagination: {
            page,
            limit,
            totalItems: total,
            totalPages: Math.max(Math.ceil(total / limit), 1),
            hasMore: skip + constraints.length < total
        }
    });
}

export async function POST(req: Request) {
    const authCheck = await requireAdmin(req);
    if (authCheck.error) return authCheck.error;

    const body = await req.json().catch(() => null);
    if (!body) {
        return jsonError("Invalid JSON body", 400);
    }

    const targetType = typeof body.targetType === "string" ? body.targetType : "";
    const targetId = typeof body.targetId === "string" && body.targetId.trim() ? body.targetId : null;
    const ruleType = typeof body.ruleType === "string" ? body.ruleType : "";
    const priority = typeof body.priority === "string" ? body.priority : "hard";
    const payload = body.payload;

    if (!TARGETS.includes(targetType as typeof TARGETS[number])) {
        return jsonError("Invalid targetType", 400);
    }

    if (!RULES.includes(ruleType as typeof RULES[number])) {
        return jsonError("Invalid ruleType", 400);
    }

    if (!PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
        return jsonError("Invalid priority", 400);
    }

    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        return jsonError("payload must be an object", 400);
    }

    const constraint = await Constraint.create({
        targetType,
        targetId,
        ruleType,
        priority,
        payload
    });

    return NextResponse.json(
        {
            success: true,
            data: {
                id: constraint._id.toString(),
                targetType: constraint.targetType,
                targetId: constraint.targetId ? constraint.targetId.toString() : null,
                ruleType: constraint.ruleType,
                priority: constraint.priority,
                payload: constraint.payload
            }
        },
        { status: 201 }
    );
}

export async function PUT(req: Request) {
    const authCheck = await requireAdmin(req);
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return jsonError("Constraint id is required", 400);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return jsonError("Invalid JSON body", 400);
    }

    const update: Record<string, unknown> = {};

    if (body.targetType) {
        if (!TARGETS.includes(body.targetType)) {
            return jsonError("Invalid targetType", 400);
        }
        update.targetType = body.targetType;
    }

    if ("targetId" in body) {
        update.targetId = typeof body.targetId === "string" && body.targetId.trim() ? body.targetId : null;
    }

    if (body.ruleType) {
        if (!RULES.includes(body.ruleType)) {
            return jsonError("Invalid ruleType", 400);
        }
        update.ruleType = body.ruleType;
    }

    if (body.priority) {
        if (!PRIORITIES.includes(body.priority)) {
            return jsonError("Invalid priority", 400);
        }
        update.priority = body.priority;
    }

    if ("payload" in body) {
        if (typeof body.payload !== "object" || body.payload === null || Array.isArray(body.payload)) {
            return jsonError("payload must be an object", 400);
        }
        update.payload = body.payload;
    }

    if (Object.keys(update).length === 0) {
        return jsonError("Nothing to update", 400);
    }

    const constraint = await Constraint.findByIdAndUpdate(id, update, { new: true });
    if (!constraint) {
        return jsonError("Constraint not found", 404);
    }

    return NextResponse.json({
        success: true,
        data: {
            id: constraint._id.toString(),
            targetType: constraint.targetType,
            targetId: constraint.targetId ? constraint.targetId.toString() : null,
            ruleType: constraint.ruleType,
            priority: constraint.priority,
            payload: constraint.payload
        }
    });
}

export async function DELETE(req: Request) {
    const authCheck = await requireAdmin(req);
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return jsonError("Constraint id is required", 400);
    }

    const deleted = await Constraint.findByIdAndDelete(id);
    if (!deleted) {
        return jsonError("Constraint not found", 404);
    }

    return NextResponse.json({
        success: true,
        message: "Constraint deleted"
    });
}
