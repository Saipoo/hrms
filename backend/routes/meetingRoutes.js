import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import VideoMeeting from '../models/VideoMeeting.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Message from '../models/Message.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Generate unique meeting ID
const generateMeetingId = () => {
  return `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Generate secure meeting link with JWT token
const generateMeetingLink = (meetingId) => {
  const token = jwt.sign(
    { meetingId, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/meeting/${meetingId}?token=${token}`;
};

// @route   POST /api/mentor/connect/meeting/create
// @desc    Create a new video meeting
// @access  Private (All Roles)
router.post('/create', protect, async (req, res) => {
  try {
    const { parentId, studentUSN, title, description, scheduledTime, duration } = req.body;

    // Validation
    if (!title || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and scheduled time'
      });
    }

    // Generate meeting details
    const meetingId = generateMeetingId();
    const meetingLink = generateMeetingLink(meetingId);

    // Create meeting
    const meeting = await VideoMeeting.create({
      meetingId,
      teacherId: req.user._id,
      teacherName: req.user.name,
      parentId: parentId || null,
      parentName: '', 
      studentUSN: (studentUSN || '').toUpperCase(),
      studentName: '',
      title,
      description: description || '',
      scheduledTime: new Date(scheduledTime),
      duration: duration || 30,
      status: 'Scheduled',
      meetingLink,
      platform: 'Jitsi',
      participants: []
    });

    // Send meeting link as a message to invited person if specified
    let meetingMessage = null;
    if (parentId) {
      meetingMessage = await Message.create({
        senderId: req.user._id,
        senderRole: req.user.role,
        receiverId: parentId,
        receiverRole: 'user', // generic role
        studentUSN: (studentUSN || '').toUpperCase(),
        messageType: 'meeting_link',
        content: `📹 Video Meeting Scheduled: ${title}\n\nTime: ${new Date(scheduledTime).toLocaleString()}\nDuration: ${duration} minutes\n\nClick to join: ${meetingLink}`,
        delivered: false,
        seen: false
      });
    }

    // Emit socket events to the invited person (if specified) and creator
    const io = req.app.get('io');
    if (io) {
      if (parentId) {
        // Send to invited user
        io.to(parentId.toString()).emit('meeting_created', {
          meeting,
          message: meetingMessage
        });
        io.to(parentId.toString()).emit('receive_message', meetingMessage);
        io.to(parentId.toString()).emit('new_message_notification', {
          from: req.user.name,
          message: `Scheduled a video meeting: ${title}`
        });
      }
      
      // Send to creator
      io.to(req.user._id.toString()).emit('meeting_created', {
        meeting,
        message: null // Creator doesn't need the message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: {
        meeting,
        meetingLink
      }
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating meeting',
      error: error.message
    });
  }
});

// @route   GET /api/mentor/connect/meeting/:meetingId
// @desc    Get meeting details
// @access  Private (All Roles)
router.get('/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await VideoMeeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Allow anyone with the link/ID to access the meeting details
    // (Removed strict teacher/parent check to allow sharing links)

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/mentor/connect/meeting/list/my-meetings
// @desc    Get all meetings for current user
// @access  Private (All Roles)
router.get('/list/my-meetings', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    let query = {
      $or: [
        { teacherId: userId },
        { parentId: userId },
        { "participants.userId": userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const meetings = await VideoMeeting.find(query)
      .sort({ scheduledTime: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching meetings',
      error: error.message
    });
  }
});

// @route   PATCH /api/mentor/connect/meeting/:meetingId/start
// @desc    Start a meeting
// @access  Private (All Roles)
router.patch('/:meetingId/start', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await VideoMeeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.teacherId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the meeting creator can start the meeting'
      });
    }

    meeting.status = 'Ongoing';
    meeting.startTime = new Date();
    await meeting.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(meeting.parentId).emit('meeting_started', {
        meetingId: meeting.meetingId,
        startTime: meeting.startTime
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting started',
      data: meeting
    });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PATCH /api/mentor/connect/meeting/:meetingId/end
// @desc    End a meeting
// @access  Private (All Roles)
router.patch('/:meetingId/end', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await VideoMeeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.teacherId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the meeting creator can end the meeting'
      });
    }

    meeting.status = 'Ended';
    meeting.endTime = new Date();
    await meeting.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(meeting.parentId).emit('meeting_ended', {
        meetingId: meeting.meetingId,
        endTime: meeting.endTime
      });
      // Broadcast to meeting room
      io.to(`meeting-${meetingId}`).emit('meeting_ended', {
        meetingId: meeting.meetingId,
        endTime: meeting.endTime
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting ended',
      data: meeting
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PATCH /api/mentor/connect/meeting/:meetingId/join
// @desc    Join a meeting
// @access  Private (All Roles)
router.patch('/:meetingId/join', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await VideoMeeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Removed access check so anyone can join via link

    // Add participant
    meeting.participants.push({
      userId: req.user._id,
      role: req.user.role,
      joinedAt: new Date()
    });

    await meeting.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`meeting-${meetingId}`).emit('participant_joined', {
        userId: req.user._id,
        name: req.user.name,
        role: req.user.role,
        joinedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Joined meeting',
      data: meeting
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
