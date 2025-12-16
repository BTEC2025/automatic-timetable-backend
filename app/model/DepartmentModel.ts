import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  department_name: string;
}

const DepartmentSchema = new Schema<IDepartment>({
  department_name: {
    type: String,
    required: true,
    unique: true
  },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
