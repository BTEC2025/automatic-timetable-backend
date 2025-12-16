
import mongoose, { Schema, Document } from 'mongoose';

export interface ITeach extends Document {
  teacher_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
}

const TeachSchema = new Schema({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
});
export default mongoose.model('Teach', TeachSchema);
