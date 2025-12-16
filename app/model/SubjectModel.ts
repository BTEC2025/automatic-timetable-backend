import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
    subject_id: string;
    subject_name: string;
    theory: number;
    practice: number;
    credit: number;
}

const SubjectSchema = new Schema<ISubject>({
    subject_id: { type: String, required: true, unique: true },
    subject_name: { type: String, required: true },
    theory: { type: Number, required: true },
    practice: { type: Number, required: true },
    credit: { type: Number, required: true },
}, { timestamps: true });


export default mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);