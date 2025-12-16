
import mongoose, { Schema, Document } from 'mongoose';

export interface IRegister extends Document {
  group_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
}

const RegisterSchema = new Schema({
  group_id: { type: Schema.Types.ObjectId, ref: 'StudentGroups', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
});

export default mongoose.models.Register || mongoose.model<IRegister>('Register', RegisterSchema);
