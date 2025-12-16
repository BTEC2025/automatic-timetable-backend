import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  studentId?: Types.ObjectId;
  teacherId?: Types.ObjectId;
  status: 'active' | 'inactive' | 'deleted';
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true,
  },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null },

  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
