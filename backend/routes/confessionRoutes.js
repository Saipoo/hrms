import express from 'express';
import confessionService from '../services/confessionService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/confessions
// @desc    Create a new confession
// @access  Private (Student only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit confessions'
      });
    }
    
    const confessionData = {
      studentId: req.user._id,
      category: req.body.category,
      subcategory: req.body.subcategory,
      content: req.body.content,
      visibility: req.body.visibility || 'Anonymous',
      shareWithParent: req.body.shareWithParent || false
    };
    
    const confession = await confessionService.createConfession(confessionData);
    
    res.status(201).json({
      success: true,
      message: 'Confession submitted successfully',
      data: {
        confessionId: confession.confessionId,
        status: confession.status,
        severity: confession.severity,
        sentiment: confession.sentiment
      }
    });
  } catch (error) {
    console.error('Error creating confession:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit confession',
      error: error.message
    });
  }
});

// @route   GET /api/confessions
// @desc    Get confessions based on user role
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      severity: req.query.severity,
      visibility: req.query.visibility,
      isFlagged: req.query.flagged === 'true' ? true : undefined
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    const confessions = await confessionService.getConfessionsByRole(
      req.user._id,
      req.user.role,
      filters
    );
    
    res.json({
      success: true,
      data: {
        confessions,
        count: confessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching confessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch confessions',
      error: error.message
    });
  }
});

// @route   GET /api/confessions/:confessionId
// @desc    Get a single confession by ID
// @access  Private
router.get('/:confessionId', protect, async (req, res) => {
  try {
    const confession = await confessionService.getConfessionById(
      req.params.confessionId,
      req.user._id,
      req.user.role
    );
    
    res.json({
      success: true,
      data: confession
    });
  } catch (error) {
    console.error('Error fetching confession:', error);
    res.status(error.message === 'Not authorized to view this confession' ? 403 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/confessions/:confessionId/status
// @desc    Update confession status
// @access  Private (Teacher/Admin)
router.put('/:confessionId/status', protect, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update confession status'
      });
    }
    
    const { status } = req.body;
    
    if (!['Pending', 'Acknowledged', 'In Discussion', 'Resolved', 'Escalated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const confession = await confessionService.updateConfessionStatus(
      req.params.confessionId,
      status,
      req.user._id,
      req.user.role
    );
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        confessionId: confession.confessionId,
        status: confession.status
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(error.message === 'Not authorized to update this confession' ? 403 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/confessions/:confessionId/responses
// @desc    Add a response to a confession
// @access  Private (Teacher/Admin)
router.post('/:confessionId/responses', protect, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to confessions'
      });
    }
    
    const responseData = {
      message: req.body.message,
      isPrivate: req.body.isPrivate || false
    };
    
    const confession = await confessionService.addResponse(
      req.params.confessionId,
      responseData,
      req.user._id,
      req.user.role
    );
    
    res.json({
      success: true,
      message: 'Response added successfully',
      data: {
        confessionId: confession.confessionId,
        responsesCount: confession.responses.length
      }
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(error.message === 'Not authorized to respond to this confession' ? 403 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/confessions/:confessionId/assign
// @desc    Assign confession to a teacher/counselor
// @access  Private (Admin only)
router.post('/:confessionId/assign', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign confessions'
      });
    }
    
    const { userId, role } = req.body;
    
    if (!['Teacher', 'Counselor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role for assignment'
      });
    }
    
    const confession = await confessionService.assignConfession(
      req.params.confessionId,
      userId,
      role,
      req.user._id
    );
    
    res.json({
      success: true,
      message: 'Confession assigned successfully',
      data: {
        confessionId: confession.confessionId,
        assignedTo: confession.assignedTo
      }
    });
  } catch (error) {
    console.error('Error assigning confession:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/confessions/:confessionId/flag
// @desc    Flag a confession for urgent attention
// @access  Private (Teacher/Admin)
router.post('/:confessionId/flag', protect, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to flag confessions'
      });
    }
    
    const { reason } = req.body;
    
    const confession = await confessionService.flagConfession(
      req.params.confessionId,
      req.user._id,
      reason
    );
    
    res.json({
      success: true,
      message: 'Confession flagged successfully',
      data: {
        confessionId: confession.confessionId,
        isFlagged: confession.isFlagged,
        priority: confession.priority
      }
    });
  } catch (error) {
    console.error('Error flagging confession:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/confessions/analytics/stats
// @desc    Get confession analytics
// @access  Private (Admin only)
router.get('/analytics/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view analytics'
      });
    }
    
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const analytics = await confessionService.getAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/confessions/ai/empathetic-response
// @desc    Get AI empathetic response before submission
// @access  Private (Student only)
router.post('/ai/empathetic-response', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is for students only'
      });
    }
    
    const { content, category } = req.body;
    
    if (!content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Content and category are required'
      });
    }
    
    const response = await confessionService.generateEmpatheticResponse(content, category);
    
    res.json({
      success: true,
      data: {
        aiResponse: response
      }
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response',
      error: error.message
    });
  }
});

// @route   GET /api/confessions/parent/emotional-health/:studentId
// @desc    Get emotional health summary for a student
// @access  Private (Parent only)
router.get('/parent/emotional-health/:studentId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can access emotional health summaries'
      });
    }
    
    // Verify this parent has access to this student
    const { default: Parent } = await import('../models/Parent.js');
    const { default: Student } = await import('../models/Student.js');
    
    const parentUser = await Parent.findById(req.user._id);
    const linkedUSN = parentUser ? (parentUser.linkedEmpId || parentUser.linkedStudentUSN) : null;
    if (!parentUser || !linkedUSN) {
      return res.status(403).json({
        success: false,
        message: 'No linked student found for this parent'
      });
    }
    
    const student = await Student.findOne({ $or: [{ usn: linkedUSN }, { empid: linkedUSN }] });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Linked student not found'
      });
    }
    
    const hasAccess = student._id.toString() === req.params.studentId;
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student\'s information'
      });
    }
    
    const summary = await confessionService.getEmotionalHealthSummary(req.params.studentId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching emotional health summary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/confessions/meta/categories
// @desc    Get available confession categories
// @access  Private
router.get('/meta/categories', protect, async (req, res) => {
  try {
    const categories = [
      'Academic Issue',
      'Faculty Concern',
      'Peer Conflict',
      'Personal/Emotional Concern',
      'College Infrastructure',
      'Harassment/Disciplinary Issue',
      'Other'
    ];
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/confessions/meta/departments
// @desc    Get available departments with teacher counts
// @access  Private (Admin only)
router.get('/meta/departments', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const Teacher = (await import('../models/Teacher.js')).default;
    
    // Get all unique departments
    const departments = await Teacher.distinct('department');
    
    // Get teacher count per department
    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const count = await Teacher.countDocuments({ department: dept });
        return { name: dept, teacherCount: count };
      })
    );
    
    res.json({
      success: true,
      data: { departments: departmentData }
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/confessions/:confessionId/assign-department
// @desc    Assign confession to all teachers in a department
// @access  Private (Admin only)
router.post('/:confessionId/assign-department', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign confessions'
      });
    }
    
    const { department } = req.body;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }
    
    const Teacher = (await import('../models/Teacher.js')).default;
    const StudentConfession = (await import('../models/StudentConfession.js')).default;
    
    // Get all teachers in the department
    const teachers = await Teacher.find({ department }).select('_id name');
    
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No teachers found in ${department} department`
      });
    }
    
    // Find confession
    let confession;
    try {
      confession = await StudentConfession.findById(req.params.confessionId);
    } catch (err) {
      // If findById fails (invalid ObjectId format), try findOne with confessionId field
      confession = await StudentConfession.findOne({ confessionId: req.params.confessionId });
    }
    
    if (!confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }
    
    // Assign to all teachers in department
    for (const teacher of teachers) {
      // Check if already assigned
      const alreadyAssigned = confession.assignedTo.some(
        a => a.userId.toString() === teacher._id.toString()
      );
      
      if (!alreadyAssigned) {
        await confession.assignTo(teacher._id, 'Teacher', req.user._id);
      }
    }
    
    res.json({
      success: true,
      message: `Confession assigned to ${teachers.length} teacher(s) in ${department} department`,
      data: {
        confessionId: confession.confessionId,
        department,
        assignedTeachers: teachers.length
      }
    });
  } catch (error) {
    console.error('Error assigning confession to department:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
