
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



export const createUser = async (req, res) => {
  try {
    let { name, email, password, gender, userType } = req.body;

    // Validate user type
    if (userType !== 'registered' && userType !== 'guest') {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }

    let hashedPassword = null;

    if (userType === 'registered') {
      // Validate required fields for registered users
      if (!name || !email || !password || !gender) {
        return res.status(400).json({ success: false, message: 'All fields are required for registered users' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      // Hash password
      hashedPassword = await bcrypt.hash(password, 10);
      
    } else { // Guest user
      if (!name || !gender) {
        return res.status(400).json({ success: false, message: "Name and gender are required for guest users" });
      }
      
      // Set guest user fields
      email = null;
      password = null;
      hashedPassword = null;
    }

    // Create new user
    const user = new User({ 
      name, 
      email: userType === 'registered' ? email : null, 
      password: hashedPassword, 
      gender, 
      userType 
    });
    
    const savedUser = await user.save();

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const JWT_EXPIRE = process.env.JWT_EXPIRE || '1y';
    const token = jwt.sign(
      { name: savedUser.name, id: savedUser._id, userType: savedUser.userType }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRE }
    );

    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    res.cookie('token', token, cookieOptions);
    
    // Don't send password in response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    return res.status(201).json({ 
      success: true, 
      message: userType === 'registered' ? 'User registered successfully' : 'Guest user created successfully',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    };

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if password is correct (you should hash and compare in production)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const JWT_EXPIRE = process.env.JWT_EXPIRE || '1y';
    const token = jwt.sign(
      { name: user.name, id: user._id, userType: user.userType }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRE }
    );
    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const authUser = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateInterest =  async (req, res) => {
  try{
      const userId = req.user.id;
      const { interests } = req.body;
    
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.interests = interests;
      await user.save();
      return res.status(200).json({ success: true, message: 'Interests updated successfully', interests: user.interests });
 
  }catch{
      return res.status(500).json({ success: false, message: 'Server error' });
  }
}


export const updateGenderPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { genderPreference } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.genderPreference = genderPreference;
    await user.save();
    return res.status(200).json({ success: true, message: 'Gender preference updated successfully'});

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json({ success: true, message: 'Logout successful' });
}


export const updateUser = async (req, res) =>  {

  const { name, interests } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }


  user.name = name;
  user.interests = interests;
  await user.save();
  return res.status(200).json({ success: true, message: 'User updated successfully', user });

}