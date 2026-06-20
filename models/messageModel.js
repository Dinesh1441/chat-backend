import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    contentType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    content: {
        type: String,
        required: true  
    },
    seen: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

messageSchema.index({ chatId: 1, timestamp: -1 });


export default mongoose.model.message || mongoose.model('Message', messageSchema);
