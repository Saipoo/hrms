import mongoose from 'mongoose';

const attendanceLogSchema = new mongoose.Schema({
  empid: {
    type: String,
    required: [true, 'Employee ID is required'],
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },
  mode: {
    type: String,
    required: [true, 'Mode is required'],
    enum: ['Face Recognition', 'Biometric', 'Remote', 'Manual'],
    default: 'Face Recognition'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent'],
    default: 'Present'
  },
  department: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Geolocation fields for HRMS attendance
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  locationVerified: {
    type: Boolean,
    default: false
  },
  // Session type for HRMS: 'check-in' | 'check-out' | 'remote'
  sessionType: {
    type: String,
    enum: ['check-in', 'check-out', 'remote', null],
    default: null
  },
  markedBy: {
    type: String,
    default: 'Employee'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
attendanceLogSchema.index({ empid: 1, date: -1 });
attendanceLogSchema.index({ subject: 1, date: -1 });

export default mongoose.model('AttendanceLog', attendanceLogSchema);
