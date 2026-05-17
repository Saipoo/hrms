import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: [true, 'Sender ID is required'],
    trim: true
  },
  senderRole: {
    type: String,
    required: [true, 'Sender role is required'],
    trim: true
  },
  receiverId: {
    type: String,
    required: [true, 'Receiver ID is required'],
    trim: true
  },
  receiverRole: {
    type: String,
    required: [true, 'Receiver role is required'],
    trim: true
  },
  studentUSN: {
    type: String,
    uppercase: true,
    trim: true
  },
  messageType: {
    type: String,
    required: [true, 'Message type is required'],
    enum: ['text', 'file', 'voice', 'meeting_link'],
    default: 'text'
  },
  content: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  seen: {
    type: Boolean,
    default: false
  },
  seenAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ studentUSN: 1, createdAt: -1 });
messageSchema.index({ seen: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
