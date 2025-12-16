import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentGroups extends Document {
    group_id: string;
    group_name: string;
    student_count: number;
    students: mongoose.Types.ObjectId[];
    advisor?: mongoose.Types.ObjectId;
    department?: mongoose.Types.ObjectId;
    yearlevel?: mongoose.Types.ObjectId;
}

const StudentGroupsSchema = new Schema<IStudentGroups>({
    group_id: { type: String, required: true, unique: true },
    group_name: { type: String, required: true },
    student_count: { type: Number, required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    advisor: { type: Schema.Types.ObjectId, ref: 'Advisor' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    yearlevel: { type: Schema.Types.ObjectId, ref: 'YearLevel' },
}, { timestamps: true });


export default mongoose.models.StudentGroups || mongoose.model<IStudentGroups>('StudentGroups', StudentGroupsSchema);