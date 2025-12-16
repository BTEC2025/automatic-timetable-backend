import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  student_id: string;
  firstName: string;
  lastName: string;
  groupId: Types.ObjectId;
}

const studentSchema = new Schema<IStudent>({
  student_id: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'StudentGroups', required: true },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', studentSchema);
