import express from 'express';
import { auth } from '../middleware/authmiddleware.js';
import { allMessages } from '../controllers/messageController.js';


const messageRoutes = express.Router();

messageRoutes.post('/all', auth, allMessages);

export default messageRoutes