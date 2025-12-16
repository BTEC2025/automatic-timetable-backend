import mongoose, { Schema, Document } from 'mongoose';

export type role = 'leader' | 'teacher';

export interface ITeacher extends Document {
    teacher_id: string;
    teacher_name: string;
    department?: mongoose.Types.ObjectId;
    role: role;
}

const TeacherSchema = new Schema<ITeacher>({
    teacher_id: { type: String, required: true, unique: true },
    teacher_name: { type: String, required: true },
    department: { type: mongoose.Types.ObjectId, ref: 'Department' },
    role: {
        type: String,
        enum: ['leader', 'teacher'],
        default: 'teacher',
    },
}, { timestamps: true });


export default mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);