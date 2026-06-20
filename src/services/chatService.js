import User from '../../models/userModel.js';
import Chat from '../../models/chatModel.js';
import Message from '../../models/messageModel.js';

export const chatSocketHandler = (io) => {
    io.on('connection', (socket) => {
        // console.log('A user connected:', socket.id);
        socket.on('sendMessage', (data) => {
            // console.log('Received message:', data);
            // io.emit('message', data);
        });

        socket.on('UpdateSocketId', (data) => {
            // console.log('Updating socket ID for user:', data);
            User.updateOne({ _id: data.userId }, { $set: { socketId: data.socketId, isOnline: true } }).exec();
            // Here you would typically update the user's record in the database with the new socket ID
        });

        socket.on('sendMessage', async (data) => {
            // console.log(data);
            const newMessage = {
                chatId: data.chatId,
                senderId: data.userId,
                content: data.content,
                contentType: data.contentType,
                seen: false
            }
            Message.create(newMessage);

            const chat = await Chat.findOne({ _id: data.chatId });
            const userAId = chat.user1.toString();
            const userBId = chat.user2.toString();
            // console.log(userAId,  userBId);
            if (userAId === data.userId) {
                const userB = await User.findById(userBId);
                // console.log(userB);
                io.to(userB.socketId).emit('newMessage', newMessage);
            } else {
                const userA = await User.findById(userAId);
                // console.log(userA);
                io.to(userA.socketId).emit('newMessage', newMessage);
            }
     

            // console.log('Received message:', data);
        });


        socket.on('typingStatus', async (data) => {
            const chat = await Chat.findOne({ _id: data.chatId }).populate('user1', '-password').populate('user2', '-password');
            // console.log(chat);
            if(chat.user1._id.toString() == data.userId) {
                console.log('user2', chat.user2.socketId);
                io.to(chat.user2.socketId).emit('typingStatus', data.status);
            } else {
                console.log('user1', chat.user1.socketId);
                io.to(chat.user1.socketId).emit('typingStatus', data.status);
            }
     
            io.to(data.socketId).emit(data.status);
        });

        socket.on('endChat', async (data) => {
            const chat = await Chat.findOne({ _id: data.chatId }).populate('user1', '-password').populate('user2', '-password');
            chat.status = 'inactive';
            chat.save();

            if(chat.user1._id.toString() === data.userId) {
                io.to(chat.user2.socketId).emit('endChat', 'inactive');
            } else {
                io.to(chat.user1.socketId).emit('endChat', 'inactive');
            }
        });


        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
            // Update the user's online status when they disconnect
            User.updateOne({ socketId: socket.id }, { $set: { isOnline: false } }).exec();
        });
    });
}