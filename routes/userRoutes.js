import express from 'express';
import {createUser, loginUser, authUser, updateInterest, updateGenderPreference, updateUser} from '../controllers/userController.js';
import { auth } from '../middleware/authmiddleware.js';


const UserRoutes =  express.Router();

UserRoutes.post('/register', createUser);
UserRoutes.post('/login', loginUser);
UserRoutes.post('/guest', createUser); // Reuse createUser for guest registration
UserRoutes.post('/auth', auth, authUser); // New route to check authentication status', 
UserRoutes.post('/update/interests', auth, updateInterest); // New route to update user interests
UserRoutes.post('/update/genderPreference', auth, updateGenderPreference); // New route
UserRoutes.post('/update', auth, updateUser);

export default UserRoutes;