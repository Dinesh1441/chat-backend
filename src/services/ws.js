import { Server } from 'socket.io';

let io

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'https://chat-7myy.vercel.app', // Replace with your frontend URL
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Add these options for better connection handling
    transports: ["polling","websocket","webtransport"],
    allowEIO3: true,
  });

    return io;
}

function getIO() {

    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket(server) first.');
    }
    return io;

}

export { initializeSocket, getIO };