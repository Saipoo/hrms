import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  empid: {
    type: String,
    required: [true, 'EmpID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  linkedEmpId: {
    type: String,
    required: [true, 'Linked Employee ID is required'],
    uppercase: true,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'parent',
    enum: ['parent']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Parent', parentSchema);
