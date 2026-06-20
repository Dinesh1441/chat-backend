import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
        values: ['registered', 'guest'],
        message: 'User type must be either registered or guest'
    },
    default: 'guest'
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female'],
      message: 'Gender must be either male or female'
    }
  },
  profileImage : {
    type: String,
    default: null
  },
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isIntrestedOn: {
    type: Boolean,
    default: false
  },
  interests: {
    type: [String],
    default: []
  },
  genderPreference: {
    type: String,
    default: 'both',
    enum: { values: ['male', 'female', 'both'],
    default: 'both' }
  }
}, {
  timestamps: true
});


// Prevent OverwriteModelError
export default  mongoose.models.User || mongoose.model('User', userSchema);