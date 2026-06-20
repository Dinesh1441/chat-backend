// src/server.js

import express from 'express'; 
import http from 'http'; 
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import UserRoutes from '../routes/userRoutes.js';
import cookieParser from "cookie-parser";
import chatRoutes from '../routes/chatRoutes.js';
import { initializeSocket } from './services/ws.js';
import { chatSocketHandler } from './services/chatService.js';
import messageRoutes from '../routes/messageRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..'); // This goes from src to backend
const uploadsPath = path.join(backendRoot, 'uploads'); // Now points to D:\react\chat\backend\uploads


const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Add this debug route to your server.js (temporarily)
app.get('/api/debug/paths', async (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const uploadsPath = path.join(__dirname, 'uploads');
  const imagePath = path.join(uploadsPath, 'image');
  
  // Check if directories exist
  const fs = await import('fs');
  
  res.json({
    __dirname: __dirname,
    uploadsPath: uploadsPath,
    imagePath: imagePath,
    uploadsExists: fs.existsSync(uploadsPath),
    imageExists: fs.existsSync(imagePath),
    files: fs.existsSync(imagePath) ? fs.readdirSync(imagePath) : []
  });
});

// Middleware
// ✅ FIXED: Changed from '../uploads' to '/uploads'
app.use('/uploads', express.static(uploadsPath));

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = initializeSocket(server);

chatSocketHandler(io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/users', UserRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'uploads')}`);
  console.log(`Uploads available at: http://localhost:${PORT}/uploads/`);
});