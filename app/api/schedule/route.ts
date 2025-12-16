import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Schedule from '@/app/model/ScheduleModel';
import Timeslot from '@/app/model/TimeslotModel';
import Subject from '@/app/model/SubjectModel';
import Room from '@/app/model/RoomModel';
import Teacher from '@/app/model/TeacherModel';
import Student from '@/app/model/StudentModel';
import StudentGroup from '@/app/model/StudentGroupsModel';
import User from '@/app/model/UserModel';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

type AuthPayload = jwt.JwtPayload & { id: string; role: 'admin' | 'teacher' | 'student' };

function jsonError(message: string, status: number) {
    return NextResponse.json({ success: false, message }, { status });
}

async function authenticate(req: Request) {
    const authHeader = req.headers.get('authorization') ?? '';
    const cookieToken = req.headers.get('cookie')?.match(/authToken=([^;]+)/)?.[1];
    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : cookieToken;

    if (!rawToken) {
        return { error: jsonError('Unauthorized', 401) };
    }

    try {
        const decoded = jwt.verify(rawToken, JWT_SECRET) as AuthPayload;
        if (!decoded?.id) {
            return { error: jsonError('Invalid token', 401) };
        }
        return { payload: decoded };
    } catch {
        return { error: jsonError('Invalid token', 401) };
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const auth = await authenticate(req);
        if (auth.error) return auth.error;

        const { searchParams } = new URL(req.url);
        const dayFilter = searchParams.get('day');
        const requestedGroup = searchParams.get('group_id');
        const requestedTeacher = searchParams.get('teacher_id');

        const user = await User.findById(auth.payload.id).lean();
        if (!user) {
            return jsonError('User not found', 404);
        }

        const query: Record<string, unknown> = {};

        if (auth.payload.role === 'teacher' && user.teacherId) {
            const teacherDoc = await Teacher.findById(user.teacherId).lean();
            if (teacherDoc) {
                query.teacher_id = teacherDoc.teacher_id;
            }
        } else if (auth.payload.role === 'student' && user.studentId) {
            const studentDoc = await Student.findById(user.studentId).lean();
            if (studentDoc?.groupId) {
                const groupDoc = await StudentGroup.findById(studentDoc.groupId).lean();
                if (groupDoc) {
                    query.group_id = groupDoc.group_id;
                }
            }
        } else if (auth.payload.role === 'admin') {
            if (requestedGroup) query.group_id = requestedGroup;
            if (requestedTeacher) query.teacher_id = requestedTeacher;
        }

        const schedules = await Schedule.find(query).lean();
        if (!schedules.length) {
            return NextResponse.json({ success: true, data: [] });
        }

        const timeslotIds = schedules.map((s) => s.timeslot_id).filter(Boolean);
        const subjectIds = Array.from(new Set(schedules.map((s) => s.subject_id)));
        const roomIds = Array.from(new Set(schedules.map((s) => s.room_id)));

        const [timeslots, subjects, rooms, groups] = await Promise.all([
            Timeslot.find({ _id: { $in: timeslotIds } }).lean(),
            Subject.find({ subject_id: { $in: subjectIds } }).lean(),
            Room.find({ room_id: { $in: roomIds } }).lean(),
            StudentGroup.find({ group_id: { $in: schedules.map((s) => s.group_id) } }).lean()
        ]);

        const timeslotMap = new Map(timeslots.map((slot) => [slot._id.toString(), slot]));
        const subjectMap = new Map(subjects.map((subj) => [subj.subject_id, subj]));
        const roomMap = new Map(rooms.map((room) => [room.room_id, room]));
        const groupMap = new Map(groups.map((group) => [group.group_id, group]));

        const normalized = schedules
            .filter((entry) => {
                if (!dayFilter) return true;
                const slot = timeslotMap.get(entry.timeslot_id);
                return slot?.day === dayFilter;
            })
            .map((entry) => {
                const slot = timeslotMap.get(entry.timeslot_id);
                const subject = subjectMap.get(entry.subject_id);
                const room = roomMap.get(entry.room_id);
                const group = groupMap.get(entry.group_id);

                return {
                    id: entry._id.toString(),
                    group: {
                        code: entry.group_id,
                        name: group?.group_name ?? null
                    },
                    subject: {
                        code: entry.subject_id,
                        name: subject?.subject_name ?? entry.subject_id
                    },
                    teacherId: entry.teacher_id,
                    room: {
                        code: entry.room_id,
                        name: room?.room_name ?? entry.room_id
                    },
                    timeslot: slot
                        ? {
                              id: slot._id.toString(),
                              day: slot.day,
                              start: slot.start,
                              end: slot.end,
                              period: slot.period
                          }
                        : null
                };
            });

        return NextResponse.json({ success: true, data: normalized });
    } catch (err) {
        console.error('GET schedule error:', err);
        return jsonError('Internal Server Error', 500);
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const auth = await authenticate(req);
        if (auth.error) return auth.error;
        if (auth.payload.role !== 'admin') {
            return jsonError('Forbidden', 403);
        }

        const body = await req.json().catch(() => null);
        if (!body) return jsonError('Invalid JSON body', 400);

        const { group_id, subject_id, teacher_id, room_id, timeslot_id } = body;
        if (!group_id || !subject_id || !teacher_id || !room_id || !timeslot_id) {
            return jsonError('group_id, subject_id, teacher_id, room_id, and timeslot_id are required', 400);
        }

        const timeslot = await Timeslot.findById(timeslot_id);
        if (!timeslot) {
            return jsonError('Invalid timeslot_id', 400);
        }

        const schedule = await Schedule.create({
            group_id,
            subject_id,
            teacher_id,
            room_id,
            timeslot_id: timeslot._id.toString()
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: schedule._id.toString()
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('POST schedule error:', err);
        return jsonError('Internal Server Error', 500);
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const auth = await authenticate(req);
        if (auth.error) return auth.error;
        if (auth.payload.role !== 'admin') {
            return jsonError('Forbidden', 403);
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return jsonError('Schedule id is required', 400);

        const deleted = await Schedule.findByIdAndDelete(id);
        if (!deleted) {
            return jsonError('Schedule item not found', 404);
        }

        return NextResponse.json({ success: true, message: 'Schedule item removed' });
    } catch (err) {
        console.error('DELETE schedule error:', err);
        return jsonError('Internal Server Error', 500);
    }
}
