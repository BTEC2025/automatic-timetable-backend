import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Schedule from "@/app/model/ScheduleModel";
import Constraint from "@/app/model/ConstraintModel";
import StudentGroup from "@/app/model/StudentGroupsModel";
import Subject from "@/app/model/SubjectModel";
import Teacher from "@/app/model/TeacherModel";
import Teach from "@/app/model/TeachModel";
import Register from "@/app/model/RegisterModel";
import Timeslot from "@/app/model/TimeslotModel";
import Room from "@/app/model/RoomModel";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

type AuthPayload = jwt.JwtPayload & { id: string; role: string };

type BlockMap = Map<string, Set<string>>;

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

function normalize(value?: string | null) {
    return (value ?? "").trim();
}

function normalizeKey(value?: string | null) {
    return normalize(value).toLowerCase();
}

function ensureSet(map: BlockMap, key: string) {
    let set = map.get(key);
    if (!set) {
        set = new Set<string>();
        map.set(key, set);
    }
    return set;
}

function describeSummary(totalRequests: number, scheduled: number, conflicts: number) {
    if (!totalRequests) {
        return "ไม่มีข้อมูลการลงทะเบียนสำหรับสร้างตารางสอน";
    }
    if (!scheduled) {
        return "ไม่สามารถสร้างตารางสอนได้ เนื่องจากไม่มีตัวเลือกเวลาหรืออาจารย์ที่ว่างตามข้อจำกัด";
    }
    const ratio = Math.round((scheduled / totalRequests) * 100);
    let text = `สร้างตารางสอนสำเร็จ ${scheduled}/${totalRequests} รายการ (${ratio}%).`;
    if (conflicts) {
        text += ` ยังมี ${conflicts} รายการที่ต้องจัดมือด้วยตัวเองเนื่องจากชนกับข้อจำกัดหรือไม่มีอาจารย์/เวลาว่าง`;
    }
    return text;
}

async function authenticate(req: Request) {
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

export async function POST(req: Request) {
    try {
        await dbConnect();

        const auth = await authenticate(req);
        if (auth.error) return auth.error;

        const [
            constraints,
            groups,
            subjects,
            teachers,
            teaches,
            registers,
            timeslots,
            rooms
        ] = await Promise.all([
            Constraint.find().lean(),
            StudentGroup.find().lean(),
            Subject.find().lean(),
            Teacher.find().lean(),
            Teach.find().lean(),
            Register.find()
                .populate({ path: "group_id", select: "group_id department yearlevel" })
                .populate({ path: "subject_id", select: "subject_id subject_name" })
                .lean(),
            Timeslot.find().sort({ day: 1, period: 1 }).lean(),
            Room.find().lean()
        ]);

        const teacherByMongoId = new Map(teachers.map((t) => [t._id.toString(), t]));
        const teacherByCode = new Map(teachers.map((t) => [t.teacher_id, t]));
        const groupByMongoId = new Map(groups.map((g) => [g._id.toString(), g]));
        const groupByCode = new Map(groups.map((g) => [g.group_id, g]));
        const subjectByMongoId = new Map(subjects.map((s) => [s._id.toString(), s]));
        const roomByMongoId = new Map(rooms.map((r) => [r._id.toString(), r]));
        const roomByCode = new Map(rooms.map((r) => [r.room_id, r]));

        const timeslotIdMap = new Map(timeslots.map((slot) => [slot._id.toString(), slot._id.toString()]));
        const timeslotLabelMap = new Map(
            timeslots.map((slot) => [
                `${slot.day}-${slot.period}`.toLowerCase(),
                slot._id.toString()
            ])
        );

        const normalizeTimeslot = (value: unknown) => {
            if (typeof value !== "string") return null;
            const trimmed = value.trim();
            if (!trimmed) return null;
            if (timeslotIdMap.has(trimmed)) return trimmed;
            const labelKey = trimmed.toLowerCase();
            return timeslotLabelMap.get(labelKey) ?? null;
        };

        const blockMap: BlockMap = new Map();

        const registerBlock = (key: string, slotIds: string[]) => {
            if (!slotIds.length) return;
            const set = ensureSet(blockMap, key);
            slotIds.forEach((slotId) => set.add(slotId));
        };

        for (const constraint of constraints) {
            const payloadSlots = Array.isArray((constraint as any)?.payload?.timeslots)
                ? (constraint as any).payload.timeslots
                : [];
            const normalizedSlots = payloadSlots
                .map((slot: unknown) => normalizeTimeslot(slot))
                .filter((slotId: any): slotId is string => Boolean(slotId));
            if (!normalizedSlots.length) continue;

            let key: string | null = null;
            const targetId = constraint.targetId ? constraint.targetId.toString() : null;

            switch (constraint.targetType) {
                case "global":
                    key = "global";
                    break;
                case "teacher": {
                    if (!targetId) break;
                    const teacher =
                        teacherByMongoId.get(targetId) ||
                        teacherByCode.get(targetId);
                    if (teacher) {
                        key = `teacher:${teacher.teacher_id}`;
                    }
                    break;
                }
                case "studentGroup": {
                    if (!targetId) break;
                    const group =
                        groupByMongoId.get(targetId) ||
                        groupByCode.get(targetId);
                    if (group) {
                        key = `group:${group.group_id}`;
                    }
                    break;
                }
                case "room": {
                    if (!targetId) break;
                    const room =
                        roomByMongoId.get(targetId) ||
                        roomByCode.get(targetId);
                    if (room) {
                        key = `room:${room.room_id}`;
                    }
                    break;
                }
                case "department":
                    if (targetId) {
                        key = `department:${targetId}`;
                    }
                    break;
                case "yearLevel":
                    if (targetId) {
                        key = `yearLevel:${targetId}`;
                    }
                    break;
                default:
                    break;
            }

            if (key) {
                registerBlock(key, normalizedSlots);
            }
        }

        const isBlocked = (keys: Array<string | null>, slotId: string) => {
            if (blockMap.get("global")?.has(slotId)) return true;
            return keys.some((key) => (key ? blockMap.get(key)?.has(slotId) : false));
        };

        const teacherBusy = new Map<string, Set<string>>();
        const groupBusy = new Map<string, Set<string>>();
        const roomBusy = new Map<string, Set<string>>();

        const markBusy = (map: Map<string, Set<string>>, key: string, slotId: string) => {
            let set = map.get(key);
            if (!set) {
                set = new Set();
                map.set(key, set);
            }
            set.add(slotId);
        };

        const hasBusy = (map: Map<string, Set<string>>, key: string, slotId: string) => {
            return map.get(key)?.has(slotId) ?? false;
        };

        const scheduleDocs: {
            group_id: string;
            timeslot_id: string;
            subject_id: string;
            teacher_id: string;
            room_id: string;
        }[] = [];

        const unscheduled: Array<{ group: string; subject: string; reason: string }> = [];

        for (const entry of registers) {
            const groupDoc = entry.group_id as unknown as (typeof groups)[number] | undefined;
            const subjectDoc = entry.subject_id as unknown as (typeof subjects)[number] | undefined;

            if (!groupDoc || !subjectDoc) {
                unscheduled.push({
                    group: groupDoc?.group_id ?? "unknown",
                    subject: subjectDoc?.subject_id ?? "unknown",
                    reason: "ข้อมูลกลุ่มหรือวิชาไม่ครบ"
                });
                continue;
            }

            const teacherCandidates = teaches
                .filter((teach) => teach.subject_id === subjectDoc.subject_id)
                .map((teach) => teacherByCode.get(teach.teacher_id))
                .filter((teacher): teacher is (typeof teachers)[number] => Boolean(teacher));

            if (!teacherCandidates.length) {
                unscheduled.push({
                    group: groupDoc.group_id,
                    subject: subjectDoc.subject_id,
                    reason: "ไม่มีอาจารย์ที่สอนวิชานี้"
                });
                continue;
            }

            let placed = false;
            for (const teacherDoc of teacherCandidates) {
                for (const slot of timeslots) {
                    const slotId = slot._id.toString();
                    const teacherKey = `teacher:${teacherDoc.teacher_id}`;
                    const groupKey = `group:${groupDoc.group_id}`;
                    const roomOption = rooms.find((room) => {
                        const roomKey = `room:${room.room_id}`;
                        return (
                            !hasBusy(roomBusy, room.room_id, slotId) &&
                            !isBlocked([roomKey], slotId)
                        );
                    });

                    if (!roomOption) {
                        continue;
                    }

                    const blockKeys = [
                        teacherKey,
                        groupKey,
                        groupDoc.department ? `department:${groupDoc.department.toString()}` : null,
                        groupDoc.yearlevel ? `yearLevel:${groupDoc.yearlevel.toString()}` : null,
                        `room:${roomOption.room_id}`
                    ];

                    const teacherBusyKey = teacherDoc.teacher_id;
                    if (
                        hasBusy(teacherBusy, teacherBusyKey, slotId) ||
                        hasBusy(groupBusy, groupDoc.group_id, slotId) ||
                        isBlocked(blockKeys, slotId)
                    ) {
                        continue;
                    }

                    scheduleDocs.push({
                        group_id: groupDoc.group_id,
                        timeslot_id: slotId,
                        subject_id: subjectDoc.subject_id,
                        teacher_id: teacherDoc.teacher_id,
                        room_id: roomOption.room_id
                    });

                    markBusy(teacherBusy, teacherBusyKey, slotId);
                    markBusy(groupBusy, groupDoc.group_id, slotId);
                    markBusy(roomBusy, roomOption.room_id, slotId);
                    placed = true;
                    break;
                }
                if (placed) break;
            }

            if (!placed) {
                unscheduled.push({
                    group: groupDoc.group_id,
                    subject: subjectDoc.subject_id,
                    reason: "ไม่มีเวลาหรือห้องว่างที่ตรงกับข้อจำกัด"
                });
            }
        }

        await Schedule.deleteMany({});
        if (scheduleDocs.length) {
            await Schedule.insertMany(scheduleDocs);
        }

        const summary = describeSummary(registers.length, scheduleDocs.length, unscheduled.length);

        return NextResponse.json({
            success: true,
            data: {
                scheduledCount: scheduleDocs.length,
                totalRequests: registers.length,
                unscheduled,
                summary
            }
        });
    } catch (err) {
        console.error("GENERATE SCHEDULE ERROR:", err);
        return jsonError("Internal Server Error", 500);
    }
}
