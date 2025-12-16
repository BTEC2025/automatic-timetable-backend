import mongoose, { Schema, Document } from 'mongoose';

export type RoomType = 'theory' | 'practice';

export interface IRoom extends Document {
    room_id: string;
    room_name: string;
    building?: string;
    room_type: RoomType;
}

const RoomSchema = new Schema<IRoom>({
    room_id: { type: String, required: true, unique: true },
    room_name: { type: String, required: true },
    building: { type: String },
    room_type: {
        type: String,
        enum: ['theory', 'practice'],
        default: 'theory',
    },
}, { timestamps: true });


export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
