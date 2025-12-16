import mongoose, { Schema, Document } from 'mongoose';

export interface IYearLevel extends Document {
  level_name: string;
}

const YearLevelSchema = new Schema<IYearLevel>({
  level_name: { type: String, required: true },
}, { timestamps: true });

YearLevelSchema.index({ levelName: 1 }, { unique: true });

export default mongoose.models.YearLevel || mongoose.model<IYearLevel>('YearLevel', YearLevelSchema);
