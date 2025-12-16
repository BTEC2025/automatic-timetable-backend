import mongoose, { Schema, Document, Types } from 'mongoose';

export type ConstraintTarget =
  | 'teacher'
  | 'studentGroup'
  | 'department'
  | 'room'
  | 'yearLevel'
  | 'global';

export type ConstraintRule =
  | 'UNAVAILABLE'
  | 'REQUIRED_SLOT'
  | 'BLOCKED_SLOT'
  | 'CUSTOM';

export interface IConstraint extends Document {
  targetType: ConstraintTarget;
  targetId?: Types.ObjectId | null;
  ruleType: ConstraintRule;
  payload: Record<string, unknown>;
  priority: 'hard' | 'soft';
}

const ConstraintSchema = new Schema<IConstraint>(
  {
    targetType: {
      type: String,
      required: true,
      enum: ['teacher', 'studentGroup', 'department', 'room', 'yearLevel', 'global'],
    },
    targetId: { type: Schema.Types.ObjectId, default: null },
    ruleType: {
      type: String,
      required: true,
      enum: ['UNAVAILABLE', 'REQUIRED_SLOT', 'BLOCKED_SLOT', 'CUSTOM'],
    },
    payload: { type: Schema.Types.Mixed, required: true },
    priority: {
      type: String,
      enum: ['hard', 'soft'],
      default: 'hard',
    },
  },
  { timestamps: true },
);

ConstraintSchema.index({ targetType: 1, targetId: 1, ruleType: 1 });

export default mongoose.models.Constraint || mongoose.model<IConstraint>('Constraint', ConstraintSchema);
