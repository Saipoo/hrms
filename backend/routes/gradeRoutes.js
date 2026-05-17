import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import StudentSubmission from '../models/StudentSubmission.js';
import TeacherDocument from '../models/TeacherDocument.js';
import Grade from '../models/Grade.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import { protect, authorize } from '../middleware/auth.js';
import { evaluateSubmission } from '../services/geminiGradingService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/grade_master/';
    
    if (file.fieldname === 'answerScript') {
      uploadPath += 'answer_scripts/';
    } else if (file.fieldname === 'questionPaper') {
      uploadPath += 'question_papers/';
    } else if (file.fieldname === 'answerKey') {
      uploadPath += 'answer_keys/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route   POST /api/grade/upload-answer
 * @desc    Student uploads answer script
 * @access  Private (Student only)
 */
router.post('/upload-answer', protect, authorize('student'), upload.single('answerScript'), async (req, res) => {
  try {
    const { subject } = req.body;
    
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Answer script file is required' });
    }
    
    // Get student details
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Create submission record
    const submission = await StudentSubmission.create({
      studentId: req.user._id,
      studentUSN: student.empid || student.usn || student._id.toString(),
      studentName: student.name,
      subject: subject,
      answerScriptUrl: req.file.path,
      status: 'Pending'
    });
    
    console.log('✅ Student submission created:', submission._id);
    
    res.status(201).json({
      success: true,
      message: 'Answer script uploaded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error uploading answer script:', error);
    res.status(500).json({ success: false, message: 'Failed to upload answer script', error: error.message });
  }
});

/**
 * @route   POST /api/grade/upload-teacher-docs
 * @desc    Teacher uploads question paper and answer key
 * @access  Private (Teacher only)
 */
router.post('/upload-teacher-docs', protect, authorize('teacher'), upload.fields([
  { name: 'questionPaper', maxCount: 1 },
  { name: 'answerKey', maxCount: 1 }
]), async (req, res) => {
  try {
    const { submissionId } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ success: false, message: 'Submission ID is required' });
    }
    
    if (!req.files || !req.files.questionPaper || !req.files.answerKey) {
      return res.status(400).json({ success: false, message: 'Both question paper and answer key are required' });
    }
    
    // Check if submission exists
    const submission = await StudentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    // Create teacher document record
    const teacherDoc = await TeacherDocument.create({
      teacherId: req.user._id,
      submissionId: submissionId,
      subject: submission.subject,
      questionPaperUrl: req.files.questionPaper[0].path,
      answerKeyUrl: req.files.answerKey[0].path
    });
    
    // Update submission with teacher ID
    submission.teacherId = req.user._id;
    await submission.save();
    
    console.log('✅ Teacher documents uploaded:', teacherDoc._id);
    
    res.status(201).json({
      success: true,
      message: 'Question paper and answer key uploaded successfully',
      data: teacherDoc
    });
  } catch (error) {
    console.error('Error uploading teacher documents:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents', error: error.message });
  }
});

/**
 * @route   POST /api/grade/evaluate/:submissionId
 * @desc    Evaluate student submission using Gemini AI
 * @access  Private (Teacher only)
 */
router.post('/evaluate/:submissionId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Get submission
    const submission = await StudentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    // Get teacher documents
    const teacherDoc = await TeacherDocument.findOne({ submissionId });
    if (!teacherDoc) {
      return res.status(404).json({ success: false, message: 'Question paper and answer key not found. Please upload them first.' });
    }
    
    console.log('🤖 Starting AI evaluation for submission:', submissionId);
    
    // Evaluate using Gemini AI
    const gradingResult = await evaluateSubmission(
      teacherDoc.questionPaperUrl,
      teacherDoc.answerKeyUrl,
      submission.answerScriptUrl,
      submission.subject
    );
    
    // Create or update grade record
    let grade = await Grade.findOne({ submissionId });
    
    if (grade) {
      // Update existing grade
      grade.aiMarks = gradingResult.total_marks_obtained;
      grade.totalMarks = gradingResult.total_max_marks;
      grade.marksPerQuestion = gradingResult.marks_per_question.map(q => ({
        questionNumber: q.question_number,
        marksObtained: q.marks_obtained,
        maxMarks: q.max_marks,
        feedback: q.feedback,
        highlights: q.highlights || []
      }));
      grade.overallFeedback = gradingResult.overall_feedback;
      grade.highlights = gradingResult.highlighted_phrases || [];
      grade.teacherId = req.user._id;
      grade.gradedDate = new Date();
      await grade.save();
    } else {
      // Create new grade
      grade = await Grade.create({
        submissionId: submissionId,
        studentId: submission.studentId,
        studentUSN: submission.studentUSN,
        studentName: submission.studentName,
        subject: submission.subject,
        aiMarks: gradingResult.total_marks_obtained,
        totalMarks: gradingResult.total_max_marks,
        marksPerQuestion: gradingResult.marks_per_question.map(q => ({
          questionNumber: q.question_number,
          marksObtained: q.marks_obtained,
          maxMarks: q.max_marks,
          feedback: q.feedback,
          highlights: q.highlights || []
        })),
        overallFeedback: gradingResult.overall_feedback,
        highlights: gradingResult.highlighted_phrases || [],
        teacherId: req.user._id
      });
    }
    
    // Update submission status
    submission.status = 'Graded';
    submission.aiMarks = gradingResult.total_marks_obtained;
    submission.totalMarks = gradingResult.total_max_marks;
    submission.feedback = gradingResult.overall_feedback;
    submission.highlights = gradingResult.highlighted_phrases || [];
    submission.marksPerQuestion = grade.marksPerQuestion;
    submission.gradedDate = new Date();
    await submission.save();
    
    console.log('✅ AI evaluation complete:', grade._id);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation completed successfully',
      data: {
        grade,
        submission,
        strengths: gradingResult.strengths || [],
        areasForImprovement: gradingResult.areas_for_improvement || []
      }
    });
  } catch (error) {
    console.error('Error evaluating submission:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate submission', error: error.message });
  }
});

/**
 * @route   PATCH /api/grade/verify/:submissionId
 * @desc    Teacher verifies and confirms final marks
 * @access  Private (Teacher only)
 */
router.patch('/verify/:submissionId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { finalMarks, finalFeedback } = req.body;
    
    // Get submission
    const submission = await StudentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    // Get grade
    const grade = await Grade.findOne({ submissionId });
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found. Please evaluate first.' });
    }
    
    // Update grade with verification
    grade.verified = true;
    grade.verificationDate = new Date();
    
    // If teacher modified marks or feedback, update them
    if (finalMarks !== undefined) {
      grade.aiMarks = finalMarks;
    }
    if (finalFeedback) {
      grade.overallFeedback = finalFeedback;
    }
    
    await grade.save();
    
    // Update submission status
    submission.status = 'Verified';
    submission.teacherVerified = true;
    submission.aiMarks = grade.aiMarks;
    submission.feedback = grade.overallFeedback;
    submission.verifiedDate = new Date();
    await submission.save();
    
    console.log('✅ Marks verified for submission:', submissionId);
    
    res.status(200).json({
      success: true,
      message: 'Marks verified and published successfully',
      data: { grade, submission }
    });
  } catch (error) {
    console.error('Error verifying marks:', error);
    res.status(500).json({ success: false, message: 'Failed to verify marks', error: error.message });
  }
});

/**
 * @route   GET /api/grade/student/submissions
 * @desc    Get all submissions for logged-in student
 * @access  Private (Student only)
 */
router.get('/student/submissions', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const submissions = await StudentSubmission.find({ studentUSN: student.empid || student.usn })
      .sort({ uploadDate: -1 })
      .populate('teacherId', 'name email');
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
});

/**
 * @route   GET /api/grade/student/results
 * @desc    Get all verified results for logged-in student
 * @access  Private (Student only)
 */
router.get('/student/results', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const grades = await Grade.find({ studentUSN: student.empid || student.usn, verified: true })
      .sort({ gradedDate: -1 })
      .populate('teacherId', 'name email');
    
    res.status(200).json({
      success: true,
      count: grades.length,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
});

/**
 * @route   GET /api/grade/teacher/submissions
 * @desc    Get all submissions for teacher's department
 * @access  Private (Teacher only)
 */
router.get('/teacher/submissions', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Get all students in teacher's department (flexible, case-insensitive matching)
    const deptWords = teacher.department.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let students = [];
    if (deptWords.length > 0) {
      const regexPatterns = deptWords.map(w => new RegExp(w, 'i'));
      students = await Student.find({
        $or: regexPatterns.map(pattern => ({ department: pattern }))
      }).select('empid usn name');
    } else {
      students = await Student.find({ department: { $regex: new RegExp(teacher.department, 'i') } }).select('empid usn name');
    }
    
    const studentUSNs = students.map(s => s.empid || s.usn);
    
    const submissions = await StudentSubmission.find({ studentUSN: { $in: studentUSNs } })
      .sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching teacher submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
});

/**
 * @route   GET /api/grade/parent/results/:usn
 * @desc    Get verified results for linked student
 * @access  Private (Parent only)
 */
router.get('/parent/results/:usn', protect, authorize('parent'), async (req, res) => {
  try {
    const { usn } = req.params;
    
    // Verify parent is linked to this student
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    
    const linkedUSN = parent.linkedEmpId || parent.linkedStudentUSN;
    if (!linkedUSN || linkedUSN.toUpperCase() !== usn.toUpperCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this student\'s results' });
    }
    
    const grades = await Grade.find({ studentUSN: usn.toUpperCase(), verified: true })
      .sort({ gradedDate: -1 })
      .populate('teacherId', 'name email');
    
    res.status(200).json({
      success: true,
      count: grades.length,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching parent results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
});

// GET: Student's grades by student ID (for parents/teachers)
router.get('/student/:studentId/results', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const grades = await Grade.find({ studentId, verified: true })
      .sort({ gradedDate: -1 })
      .populate('teacherId', 'name email');
    
    res.json({
      success: true,
      grades: grades
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student grades',
      error: error.message
    });
  }
});

export default router;
