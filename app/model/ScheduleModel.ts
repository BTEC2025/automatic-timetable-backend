
import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
    group_id: string;
    timeslot_id: string;
    subject_id: string;
    teacher_id: string;
    room_id: string;
}

const ScheduleSchema = new Schema({
    group_id: { type: String, ref: 'StudentGroups', required: true },
    timeslot_id: { type: String, ref: 'Timeslot', required: true },
    subject_id: { type: String, ref: 'Subject', required: true },
    teacher_id: { type: String, ref: 'Teacher', required: true },
    room_id: { type: String, ref: 'Room', required: true },
});

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);
