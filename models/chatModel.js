import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    roomId: {
        type: String,
        required: true,
        unique: true
    },
}, { timestamps: true });

chatSchema.index({ user1: 1, user2: 1 });

export default mongoose.model.chat || mongoose.model('Chat', chatSchema);

