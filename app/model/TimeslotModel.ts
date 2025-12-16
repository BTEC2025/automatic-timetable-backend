import mongoose, { Schema, Document } from 'mongoose';

export type DayOfWeek =
  | 'Mon'
  | 'Tue'
  | 'Wed`'
  | 'Thu'
  | 'Fri';

export interface ITimeslot extends Document {
  day: DayOfWeek;
  period: string;
  start: string;
  end: string;
}

const TimeslotSchema = new Schema<ITimeslot>(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      required: true,
    },
    period: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { timestamps: true },
);

TimeslotSchema.index({ day: 1, period: 1 }, { unique: true });

export default mongoose.models.Timeslot || mongoose.model<ITimeslot>('Timeslot', TimeslotSchema);
