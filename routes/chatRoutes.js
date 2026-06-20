import express from 'express'
import { createChat, chatPartner, getChat, createImage} from '../controllers/chatController.js';
import { uploadChatImage } from '../middleware/multer.js';
import { auth } from '../middleware/authmiddleware.js';

const chatRoutes = express.Router();

chatRoutes.post('/create', auth, createChat);
chatRoutes.post('/partner', auth, chatPartner);
chatRoutes.post('/get', auth, getChat);
chatRoutes.post('/upload-image', auth,  uploadChatImage.single('image'), createImage);

export default chatRoutes