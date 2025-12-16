
import mongoose, { Schema, Document } from 'mongoose';

export interface ITeach extends Document {
  teacher_id: string;
  subject_id: string;
}

const TeachSchema = new Schema({
  teacher_id: { type: String, ref: 'Teacher', required: true },
  subject_id: { type: String, ref: 'Subject', required: true },
});
export default mongoose.models.Teach || mongoose.model<ITeach>('Teach', TeachSchema);
