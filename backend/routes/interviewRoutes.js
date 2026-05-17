import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import interviewService from '../services/interviewService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/interview/categories
 * @desc    Get available interview categories
 * @access  Private (Student)
 */
router.get('/categories', protect, authorize('student'), async (req, res) => {
  try {
    const categories = [
      {
        id: 'google',
        name: 'Google',
        logo: '🔍',
        domains: ['Frontend', 'Backend', 'Full Stack', 'AI/ML', 'Data Science'],
        difficulty: 'Hard',
        duration: 45
      },
      {
        id: 'microsoft',
        name: 'Microsoft',
        logo: '🪟',
        domains: ['Frontend', 'Backend', 'Full Stack', 'DevOps', 'AI/ML'],
        difficulty: 'Hard',
        duration: 45
      },
      {
        id: 'amazon',
        name: 'Amazon',
        logo: '📦',
        domains: ['Backend', 'Full Stack', 'DevOps', 'Data Science'],
        difficulty: 'Hard',
        duration: 40
      },
      {
        id: 'infosys',
        name: 'Infosys',
        logo: '🏢',
        domains: ['Frontend', 'Backend', 'Full Stack', 'Mobile Development'],
        difficulty: 'Medium',
        duration: 30
      },
      {
        id: 'tcs',
        name: 'TCS',
        logo: '🏛️',
        domains: ['Frontend', 'Backend', 'Full Stack', 'Data Science'],
        difficulty: 'Medium',
        duration: 30
      },
      {
        id: 'wipro',
        name: 'Wipro',
        logo: '🌐',
        domains: ['Frontend', 'Backend', 'Full Stack', 'DevOps'],
        difficulty: 'Medium',
        duration: 30
      },
      {
        id: 'cognizant',
        name: 'Cognizant',
        logo: '💼',
        domains: ['Frontend', 'Backend', 'Full Stack', 'Mobile Development'],
        difficulty: 'Medium',
        duration: 30
      }
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview categories'
    });
  }
});

/**
 * @route   POST /api/interview/start
 * @desc    Initialize a new interview session
 * @access  Private (Student)
 */
router.post('/start', protect, authorize('student'), async (req, res) => {
  try {
    const { category, domain, role, difficulty } = req.body;

    if (!category || !domain || !role) {
      return res.status(400).json({
        success: false,
        message: 'Category, domain, and role are required'
      });
    }

    // Generate questions using Gemini AI
    const questionsResult = await interviewService.instance.generateQuestions(
      category,
      domain,
      role,
      difficulty || 'Medium'
    );

    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate interview questions'
      });
    }

    // Create interview session
    const session = await InterviewSession.create({
      studentUSN: req.user.usn || req.user.empid || req.user._id || 'EMPLOYEE',
      studentName: req.user.name,
      category,
      domain,
      role,
      difficulty: difficulty || 'Medium',
      duration: 30,
      questions: {
        personal: questionsResult.questions.personal.map(q => ({ question: q, answer: '' })),
        technical: questionsResult.questions.technical.map(q => ({ question: q, answer: '' })),
        coding: questionsResult.questions.coding.map(q => ({ question: q, answer: '', code: '' }))
      },
      totalQuestions: 12,
      status: 'in-progress'
    });

    res.json({
      success: true,
      message: 'Interview session started successfully',
      sessionId: session._id,
      questions: questionsResult.questions,
      duration: session.duration
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview session'
    });
  }
});

/**
 * @route   POST /api/interview/:sessionId/submit-answer
 * @desc    Submit answer for a question
 * @access  Private (Student)
 */
router.post('/:sessionId/submit-answer', protect, authorize('student'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionType, questionIndex, answer, code } = req.body;

    const session = await InterviewSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    if (session.studentUSN !== (req.user.usn || req.user.empid || req.user._id || 'EMPLOYEE')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this session'
      });
    }

    // Update answer
    if (questionType === 'personal') {
      session.questions.personal[questionIndex].answer = answer;
      session.questions.personal[questionIndex].timestamp = new Date();
    } else if (questionType === 'technical') {
      session.questions.technical[questionIndex].answer = answer;
      session.questions.technical[questionIndex].timestamp = new Date();
    } else if (questionType === 'coding') {
      session.questions.coding[questionIndex].answer = answer;
      session.questions.coding[questionIndex].code = code || '';
      session.questions.coding[questionIndex].timestamp = new Date();
    }

    session.currentQuestionIndex += 1;
    await session.save();

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      currentQuestion: session.currentQuestionIndex,
      totalQuestions: session.totalQuestions
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer'
    });
  }
});

/**
 * @route   POST /api/interview/:sessionId/complete
 * @desc    Complete interview and generate report
 * @access  Private (Student)
 */
router.post('/:sessionId/complete', protect, authorize('student'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    if (session.studentUSN !== (req.user.usn || req.user.empid || req.user._id || 'EMPLOYEE')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this session'
      });
    }

    // Mark session as completed
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Generate AI evaluation report
    const reportResult = await interviewService.instance.generateReport({
      questions: session.questions,
      category: session.category,
      domain: session.domain,
      role: session.role
    });

    if (!reportResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate interview report'
      });
    }

    const report = reportResult.report;

    // Create interview report
    const interviewReport = await InterviewReport.create({
      sessionId: session._id,
      studentUSN: session.studentUSN,
      studentName: session.studentName,
      category: session.category,
      domain: session.domain,
      role: session.role,
      scores: report.scores,
      analysis: {
        strengths: report.strengths,
        improvements: report.improvements,
        bodyLanguage: 'Analysis based on video recording',
        eyeContact: 'Maintained good eye contact',
        clarity: 'Clear and articulate',
        pace: 'Well-paced responses',
        vocabulary: 'Professional vocabulary'
      },
      aiFeedback: {
        summary: report.summary,
        detailedFeedback: report.detailedFeedback,
        recommendations: report.recommendations,
        suggestedCourses: report.suggestedCourses
      },
      duration: Math.floor((session.completedAt - session.startedAt) / 1000),
      completedAt: session.completedAt
    });

    res.json({
      success: true,
      message: 'Interview completed successfully',
      reportId: interviewReport._id,
      scores: interviewReport.scores
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete interview'
    });
  }
});

/**
 * @route   GET /api/interview/results/:studentUSN
 * @desc    Get interview reports for a student
 * @access  Private (Student, Parent, Teacher)
 */
router.get('/results/:studentUSN', protect, async (req, res) => {
  try {
    const { studentUSN } = req.params;

    // Debug logging
    console.log('📊 Fetching interview results for:', studentUSN);
    console.log('👤 User role:', req.user.role);
    console.log('🔗 User linkedStudentUSN:', req.user.linkedStudentUSN);
    console.log('📝 User USN:', req.user.usn);

    // Authorization check
    const userUSN = (req.user.usn || req.user.empid || req.user._id || 'EMPLOYEE').toUpperCase();
    const targetUSN = studentUSN.toUpperCase();
    if (req.user.role === 'student' && userUSN !== targetUSN) {
      console.log('❌ Student unauthorized: USN mismatch');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (req.user.role === 'parent' && req.user.linkedStudentUSN !== studentUSN) {
      console.log('❌ Parent unauthorized: linkedStudentUSN mismatch');
      console.log('   Expected:', studentUSN);
      console.log('   Got:', req.user.linkedStudentUSN);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this student\'s data'
      });
    }

    const reports = await InterviewReport.find({ studentUSN: studentUSN.toUpperCase() })
      .sort({ createdAt: -1 })
      .populate('sessionId', 'category domain role difficulty duration');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview results'
    });
  }
});

/**
 * @route   GET /api/interview/report/:reportId
 * @desc    Get detailed interview report
 * @access  Private (Student, Parent, Teacher)
 */
router.get('/report/:reportId', protect, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await InterviewReport.findById(reportId)
      .populate('sessionId', 'questions category domain role difficulty duration');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Interview report not found'
      });
    }

    // Authorization check
    if (req.user.role === 'student' && (req.user.usn || req.user.empid || req.user._id || 'EMPLOYEE').toUpperCase() !== report.studentUSN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (req.user.role === 'parent' && req.user.linkedStudentUSN !== report.studentUSN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Mark as viewed
    if (!report.isViewed) {
      report.isViewed = true;
      report.viewedAt = new Date();
      await report.save();
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching interview report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview report'
    });
  }
});

/**
 * @route   GET /api/interview/all-reports
 * @desc    Get all interview reports (Teacher only)
 * @access  Private (Teacher)
 */
router.get('/all-reports', protect, authorize('teacher'), async (req, res) => {
  try {
    const reports = await InterviewReport.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sessionId', 'category domain role difficulty');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview reports'
    });
  }
});

/**
 * @route   POST /api/interview/report/:reportId/remark
 * @desc    Add teacher remarks to interview report
 * @access  Private (Teacher)
 */
router.post('/report/:reportId/remark', protect, authorize('teacher'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const report = await InterviewReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Interview report not found'
      });
    }

    report.teacherRemarks = {
      comment,
      remarksBy: req.user._id,
      remarksAt: new Date()
    };

    await report.save();

    res.json({
      success: true,
      message: 'Remarks added successfully',
      data: report
    });
  } catch (error) {
    console.error('Error adding remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add remarks'
    });
  }
});

export default router;
