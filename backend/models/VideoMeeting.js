import mongoose from 'mongoose';

const videoMeetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: [true, 'Meeting ID is required'],
    unique: true,
    trim: true
  },
  teacherId: {
    type: String,
    trim: true
  },
  teacherName: {
    type: String,
    trim: true
  },
  parentId: {
    type: String,
    trim: true
  },
  parentName: {
    type: String,
    trim: true
  },
  studentUSN: {
    type: String,
    uppercase: true,
    trim: true
  },
  studentName: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Ended', 'Cancelled'],
    default: 'Scheduled'
  },
  meetingLink: {
    type: String,
    required: [true, 'Meeting link is required'],
    trim: true
  },
  participants: [{
    userId: String,
    role: String,
    joinedAt: Date,
    leftAt: Date
  }],
  recordingLink: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    enum: ['WebRTC', 'Jitsi'],
    default: 'Jitsi'
  }
}, {
  timestamps: true
});

// Index for faster queries
videoMeetingSchema.index({ teacherId: 1, createdAt: -1 });
videoMeetingSchema.index({ parentId: 1, createdAt: -1 });
videoMeetingSchema.index({ studentUSN: 1, createdAt: -1 });
videoMeetingSchema.index({ status: 1, scheduledTime: 1 });
videoMeetingSchema.index({ meetingId: 1 });

const VideoMeeting = mongoose.model('VideoMeeting', videoMeetingSchema);

export default VideoMeeting;
