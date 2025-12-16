
import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
    group_id: mongoose.Types.ObjectId;
    timeslot_id: mongoose.Types.ObjectId;
    subject_id: mongoose.Types.ObjectId;
    teacher_id: mongoose.Types.ObjectId;
    room_id: mongoose.Types.ObjectId;
}

const ScheduleSchema = new Schema({
    group_id: { type: Schema.Types.ObjectId, ref: 'StudentGroups', required: true },
    timeslot_id: { type: Schema.Types.ObjectId, ref: 'Timeslot', required: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    room_id: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
});

export default mongoose.model('Schedule', ScheduleSchema) || mongoose.model<ISchedule>('Schedule', ScheduleSchema);