import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  student_id: string;
  student_name: string;
  groupId: Types.ObjectId;
}

const studentSchema = new Schema<IStudent>({
  student_id: { type: String, required: true, unique: true },
  student_name: { type: String, required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'StudentGroups', required: true },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', studentSchema);
