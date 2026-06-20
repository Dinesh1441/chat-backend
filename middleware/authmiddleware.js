import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


export const auth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    // console.log('Auth Middleware - Token:', token);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token found'
        });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Store decoded user data in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

