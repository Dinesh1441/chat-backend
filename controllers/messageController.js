import Message from '../models/messageModel.js';



export const allMessages = async (req, res) => {
    try {
        const { chatId } = req.body;
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};