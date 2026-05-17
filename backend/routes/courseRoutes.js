import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import Certificate from '../models/Certificate.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateCertificate, generateCertificateId } from '../services/certificateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/courses/';
    
    if (file.fieldname === 'thumbnail') {
      uploadPath += 'thumbnails/';
    } else if (file.fieldname === 'video') {
      uploadPath += 'videos/';
    } else if (file.fieldname === 'resource') {
      uploadPath += 'resources/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails'));
    }
  } else if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  } else if (file.fieldname === 'resource') {
    const allowedTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-powerpoint',
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX files are allowed for resources'));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// ==================== FILE UPLOAD ROUTES (Must be before parameterized routes) ====================

/**
 * @route   POST /api/courses/upload/thumbnail
 * @desc    Upload course thumbnail
 * @access  Private (Teacher)
 */
router.post('/upload/thumbnail', protect, authorize('teacher'), upload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileUrl = `uploads/courses/thumbnails/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      fileUrl
    });
    
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading thumbnail'
    });
  }
});

/**
 * @route   POST /api/courses/upload/video
 * @desc    Upload course video
 * @access  Private (Teacher)
 */
router.post('/upload/video', protect, authorize('teacher'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileUrl = `uploads/courses/videos/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      fileUrl
    });
    
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading video'
    });
  }
});

/**
 * @route   POST /api/courses/upload/resource
 * @desc    Upload course resource
 * @access  Private (Teacher)
 */
router.post('/upload/resource', protect, authorize('teacher'), upload.single('resource'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileUrl = `uploads/courses/resources/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Resource uploaded successfully',
      fileUrl,
      fileType: req.file.mimetype
    });
    
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading resource'
    });
  }
});

// ==================== STUDENT ROUTES ====================

/**
 * @route   GET /api/courses/all
 * @desc    Get all published courses (Student view)
 * @access  Private (Student)
 */
router.get('/all', protect, authorize('student'), async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { published: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const courses = await Course.find(query)
      .populate('teacherId', 'name email department')
      .sort({ createdAt: -1 })
      .lean();
    
    // Check enrollment status for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await CourseEnrollment.findOne({
          courseId: course._id,
          studentId: req.user._id
        });
        
        return {
          ...course,
          isEnrolled: !!enrollment,
          progress: enrollment ? enrollment.overallProgress : 0,
          completed: enrollment ? enrollment.completed : false
        };
      })
    );
    
    res.json({
      success: true,
      count: coursesWithEnrollment.length,
      courses: coursesWithEnrollment
    });
    
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

/**
 * @route   POST /api/courses/progress/update
 * @desc    Update video watch progress
 * @access  Private (Student)
 */
router.post('/progress/update', protect, authorize('student'), async (req, res) => {
  try {
    const { enrollmentId, videoId, watchedDuration, completed } = req.body;
    
    const enrollment = await CourseEnrollment.findById(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Find or create video progress entry
    const videoProgressIndex = enrollment.videoProgress.findIndex(
      vp => vp.videoId.toString() === videoId
    );
    
    if (videoProgressIndex >= 0) {
      enrollment.videoProgress[videoProgressIndex].watchedDuration = watchedDuration;
      enrollment.videoProgress[videoProgressIndex].completed = completed;
      enrollment.videoProgress[videoProgressIndex].lastWatchedAt = new Date();
    } else {
      enrollment.videoProgress.push({
        videoId,
        completed,
        watchedDuration,
        lastWatchedAt: new Date()
      });
    }
    
    // Calculate overall progress
    const course = await Course.findById(enrollment.courseId);
    const totalVideos = course.videos.length;
    const completedVideos = enrollment.videoProgress.filter(vp => vp.completed).length;
    enrollment.overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    
    // Videos are optional - quiz completion is what matters
    // No auto-completion here, quiz determines completion
    
    await enrollment.save();
    
    res.json({
      success: true,
      message: 'Progress updated',
      overallProgress: enrollment.overallProgress,
      completed: enrollment.completed
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
});

/**
 * @route   GET /api/courses/progress/:studentId
 * @desc    Get all course enrollments for a student
 * @access  Private
 */
router.get('/progress/:studentId', protect, async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({
      studentId: req.params.studentId
    })
    .populate('courseId')
    .sort({ enrolledAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments'
    });
  }
});

// ==================== TEACHER ROUTES ====================

/**
 * @route   POST /api/courses/create
 * @desc    Create a new course
 * @access  Private (Teacher)
 */
router.post('/create', protect, authorize('teacher'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      estimatedDuration,
      thumbnailUrl
    } = req.body;
    
    const course = await Course.create({
      title,
      description,
      category,
      level: level || 'Beginner',
      estimatedDuration: estimatedDuration || 0,
      thumbnailUrl: thumbnailUrl || '',
      teacherId: req.user._id,
      teacherName: req.user.name,
      teacherDepartment: req.user.department || '',
      videos: [],
      resources: [],
      quizzes: [],
      published: false,
      enrollmentCount: 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
    
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course'
    });
  }
});

/**
 * @route   GET /api/courses/teacher/my-courses
 * @desc    Get all courses created by teacher
 * @access  Private (Teacher)
 */
router.get('/teacher/my-courses', protect, authorize('teacher'), async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    // Get enrollment count for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await CourseEnrollment.countDocuments({
          courseId: course._id
        });
        
        const completedCount = await CourseEnrollment.countDocuments({
          courseId: course._id,
          completed: true
        });
        
        return {
          ...course,
          enrollmentCount,
          completedCount
        };
      })
    );
    
    res.json({
      success: true,
      count: coursesWithStats.length,
      courses: coursesWithStats
    });
    
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

/**
 * @route   GET /api/courses/my-enrollments
 * @desc    Get current student's enrolled courses
 * @access  Private (Student)
 */
router.get('/my-enrollments', protect, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const enrollments = await CourseEnrollment.find({ studentId })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    
    const validEnrollments = enrollments.filter(e => e.courseId);
    
    res.json({
      success: true,
      enrollments: validEnrollments
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/my-certificates
 * @desc    Get current student's certificates
 * @access  Private (Student)
 */
router.get('/my-certificates', protect, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const certificates = await Certificate.find({ studentId })
      .populate('courseId')
      .sort({ issuedAt: -1 });
    
    const validCertificates = certificates.filter(c => c.courseId);
    
    res.json({
      success: true,
      certificates: validCertificates
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/student/:studentId/enrollments
 * @desc    Get student's enrollments by ID (for parents/teachers)
 * @access  Private
 */
router.get('/student/:studentId/enrollments', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if studentId is USN or ObjectId
    let enrollments;
    if (studentId.match(/^[0-9A-Z]{4,15}$/)) {
      // It's an empid
      enrollments = await CourseEnrollment.find({ empid: studentId.toUpperCase() })
        .populate('courseId')
        .sort({ enrolledAt: -1 });
    } else {
      // It's an ObjectId
      enrollments = await CourseEnrollment.find({ studentId })
        .populate('courseId')
        .sort({ enrolledAt: -1 });
    }
    
    const validEnrollments = enrollments.filter(e => e.courseId);
    
    // Map to include progress from enrollment
    const enrollmentsWithProgress = validEnrollments.map(enrollment => ({
      _id: enrollment._id,
      course: enrollment.courseId,
      courseName: enrollment.courseName,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt,
      progress: enrollment.overallProgress || 0
    }));
    
    res.json({
      success: true,
      data: enrollmentsWithProgress
    });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student enrollments',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/student/:studentId/certificates
 * @desc    Get student's certificates by ID (for parents/teachers)
 * @access  Private
 */
router.get('/student/:studentId/certificates', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if studentId is USN or ObjectId
    let certificates;
    if (studentId.match(/^[0-9A-Z]{4,15}$/)) {
      // It's an empid
      certificates = await Certificate.find({ empid: studentId.toUpperCase() })
        .populate('courseId')
        .sort({ issuedDate: -1 });
    } else {
      // It's an ObjectId
      certificates = await Certificate.find({ studentId })
        .populate('courseId')
        .sort({ issuedDate: -1 });
    }
    
    const validCertificates = certificates.filter(c => c.courseId);
    
    res.json({
      success: true,
      data: validCertificates
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student certificates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId
 * @desc    Get single course details
 * @access  Private
 */
router.get('/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('teacherId', 'name email department');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if student is enrolled
    let enrollment = null;
    if (req.user.role === 'student') {
      enrollment = await CourseEnrollment.findOne({
        courseId: course._id,
        studentId: req.user._id
      });
    }
    
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        isEnrolled: !!enrollment,
        progress: enrollment ? enrollment.overallProgress : 0,
        completed: enrollment ? enrollment.completed : false,
        enrollmentId: enrollment ? enrollment._id : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details'
    });
  }
});

/**
 * @route   POST /api/courses/enroll/:courseId
 * @desc    Enroll in a course
 * @access  Private (Student)
 */
router.post('/enroll/:courseId', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (!course.published) {
      return res.status(400).json({
        success: false,
        message: 'This course is not published yet'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      courseId: course._id,
      studentId: req.user._id
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }
    
    // Create enrollment
    const enrollment = await CourseEnrollment.create({
      courseId: course._id,
      courseName: course.title,
      studentId: req.user._id,
      empid: req.user.empid,
      studentName: req.user.name,
      videoProgress: [],
      quizAttempts: [],
      overallProgress: 0,
      completed: false
    });
    
    // Increment enrollment count
    course.enrollmentCount += 1;
    await course.save();
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in the course',
      enrollment
    });
    
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
});

/**
 * @route   POST /api/courses/quiz/:courseId/submit
 * @desc    Submit quiz answers
 * @access  Private (Student)
 */
router.post('/quiz/:courseId/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { enrollmentId, answers } = req.body; // answers: [{ questionId, answer }]
    
    const enrollment = await CourseEnrollment.findById(enrollmentId);
    const course = await Course.findById(req.params.courseId);
    
    if (!enrollment || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course or enrollment not found'
      });
    }
    
    // Evaluate answers
    let score = 0;
    let totalMarks = 0;
    const evaluatedAnswers = [];
    
    course.quizzes.forEach((quiz, index) => {
      totalMarks += quiz.marks;
      const studentAnswer = answers.find(a => a.questionId === quiz._id.toString());
      
      if (studentAnswer) {
        // Find the index of the selected option
        const selectedOptionIndex = quiz.options.findIndex(opt => 
          opt.toLowerCase().trim() === studentAnswer.answer.toLowerCase().trim()
        );
        
        // Debug logging
        console.log(`\n=== Quiz Question ${index + 1} ===`);
        console.log('Question:', quiz.question);
        console.log('Options:', quiz.options);
        console.log('Student answered:', studentAnswer.answer);
        console.log('Selected option index:', selectedOptionIndex);
        console.log('Correct answer (raw):', quiz.correctAnswer, typeof quiz.correctAnswer);
        
        // Handle different formats of correctAnswer:
        // 1. Number/Index (dummy courses): correctAnswer: 0, 1, 2, 3
        // 2. Text (teacher courses): correctAnswer: "machine learning"
        // 3. String number: correctAnswer: "0", "1", "2", "3"
        
        let isCorrect = false;
        let correctAnswerText = '';
        
        if (typeof quiz.correctAnswer === 'number') {
          // Format 1: Number index (dummy courses)
          isCorrect = selectedOptionIndex === quiz.correctAnswer;
          correctAnswerText = quiz.options[quiz.correctAnswer];
        } else if (!isNaN(parseInt(quiz.correctAnswer)) && quiz.options[parseInt(quiz.correctAnswer)]) {
          // Format 3: String number like "0", "1", "2"
          const correctIndex = parseInt(quiz.correctAnswer);
          isCorrect = selectedOptionIndex === correctIndex;
          correctAnswerText = quiz.options[correctIndex];
        } else {
          // Format 2: Direct text match (teacher courses)
          isCorrect = studentAnswer.answer.toLowerCase().trim() === quiz.correctAnswer.toLowerCase().trim();
          correctAnswerText = quiz.correctAnswer;
        }
        
        console.log('Correct answer text:', correctAnswerText);
        console.log('Is Correct?', isCorrect);
        
        if (isCorrect) {
          score += quiz.marks;
        }
        
        evaluatedAnswers.push({
          questionId: quiz._id.toString(),
          answer: studentAnswer.answer,
          isCorrect,
          correctAnswer: correctAnswerText // Include correct answer for reference
        });
      } else {
        evaluatedAnswers.push({
          questionId: quiz._id.toString(),
          answer: '',
          isCorrect: false
        });
      }
    });
    
    // Save quiz attempt
    enrollment.quizAttempts.push({
      attemptDate: Date.now(),
      score,
      totalMarks,
      answers: evaluatedAnswers
    });
    
    // Calculate quiz percentage
    const quizPercentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    
    // Check if course is completed (quiz score >= 50%)
    if (quizPercentage >= 50 && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completionDate = Date.now();
      enrollment.overallProgress = 100;
    }
    
    await enrollment.save();
    
    res.json({
      success: true,
      message: quizPercentage >= 50 ? 'Quiz passed! Course completed!' : 'Quiz submitted successfully',
      score,
      totalMarks,
      percentage: quizPercentage,
      completed: enrollment.completed,
      evaluatedAnswers
    });
    
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz'
    });
  }
});

/**
 * @route   GET /api/courses/progress/:studentId
 * @desc    Get student's course progress (can be used by student or teacher)
 * @access  Private
 */
router.get('/progress/:studentId', protect, async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({
      studentId: req.params.studentId
    }).populate('courseId', 'title category thumbnailUrl');
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress'
    });
  }
});

/**
 * @route   POST /api/courses/generateCertificate/:courseId
 * @desc    Generate course completion certificate
 * @access  Private (Student)
 */
router.post('/generateCertificate/:courseId', protect, authorize('student'), async (req, res) => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      courseId: req.params.courseId,
      studentId: req.user._id
    });
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    if (!enrollment.completed) {
      return res.status(400).json({
        success: false,
        message: 'Course not completed yet'
      });
    }
    
    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      courseId: req.params.courseId,
      studentId: req.user._id
    });
    
    if (certificate) {
      return res.json({
        success: true,
        message: 'Certificate already generated',
        certificate
      });
    }
    
    const course = await Course.findById(req.params.courseId).populate('teacherId');
    
    // Get best quiz score
    let bestScore = 0;
    let totalMarks = 0;
    if (enrollment.quizAttempts.length > 0) {
      const sortedAttempts = enrollment.quizAttempts.sort((a, b) => b.score - a.score);
      bestScore = sortedAttempts[0].score;
      totalMarks = sortedAttempts[0].totalMarks;
    }
    
    // Generate certificate ID
    const certificateId = generateCertificateId();
    
    // Generate PDF
    const certificateData = {
      studentName: req.user.name,
      courseName: course.title,
      teacherName: course.teacherName || course.teacherId.name,
      completionDate: enrollment.completionDate,
      certificateId,
      quizScore: bestScore,
      totalQuizMarks: totalMarks
    };
    
    const pdfResult = await generateCertificate(certificateData);
    
    // Save certificate to database
    certificate = await Certificate.create({
      certificateId,
      studentId: req.user._id,
      studentUSN: req.user.usn,
      studentName: req.user.name,
      courseId: course._id,
      courseName: course.title,
      teacherId: course.teacherId._id,
      teacherName: course.teacherName || course.teacherId.name,
      completionDate: enrollment.completionDate,
      pdfUrl: pdfResult.relativePath,
      quizScore: bestScore,
      totalQuizMarks: totalMarks
    });
    
    // Update enrollment
    enrollment.certificateGenerated = true;
    enrollment.certificateId = certificateId;
    await enrollment.save();
    
    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificate
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate'
    });
  }
});

/**
 * @route   PATCH /api/courses/update/:courseId
 * @desc    Update course details
 * @access  Private (Teacher)
 */
router.patch('/update/:courseId', protect, authorize('teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if teacher owns this course
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }
    
    // Update fields
    const allowedUpdates = ['title', 'description', 'category', 'level', 'estimatedDuration', 'thumbnailUrl'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
    
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/video
 * @desc    Add video to course
 * @access  Private (Teacher)
 */
router.post('/:courseId/video', protect, authorize('teacher'), async (req, res) => {
  try {
    const { title, url, duration, order } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check authorization
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    course.videos.push({
      title,
      url,
      duration: duration || 0,
      order: order || course.videos.length + 1
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Video added successfully',
      course
    });
    
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding video'
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/resource
 * @desc    Add resource to course
 * @access  Private (Teacher)
 */
router.post('/:courseId/resource', protect, authorize('teacher'), async (req, res) => {
  try {
    const { title, type, url } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    course.resources.push({
      title,
      type,
      url
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Resource added successfully',
      course
    });
    
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding resource'
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/quiz
 * @desc    Add quiz question to course
 * @access  Private (Teacher)
 */
router.post('/:courseId/quiz', protect, authorize('teacher'), async (req, res) => {
  try {
    const { question, type, options, correctAnswer, marks } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    course.quizzes.push({
      question,
      type,
      options: options || [],
      correctAnswer,
      marks: marks || 10
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Quiz question added successfully',
      course
    });
    
  } catch (error) {
    console.error('Error adding quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding quiz'
    });
  }
});

/**
 * @route   PATCH /api/courses/publish/:courseId
 * @desc    Toggle course publish status
 * @access  Private (Teacher)
 */
router.patch('/publish/:courseId', protect, authorize('teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    course.published = !course.published;
    await course.save();
    
    res.json({
      success: true,
      message: `Course ${course.published ? 'published' : 'unpublished'} successfully`,
      course
    });
    
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing course'
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/enrollments
 * @desc    Get all students enrolled in a course
 * @access  Private (Teacher)
 */
router.get('/:courseId/enrollments', protect, authorize('teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const enrollments = await CourseEnrollment.find({
      courseId: req.params.courseId
    }).sort({ enrolledAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments'
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/certificates
 * @desc    Get all certificates for a course
 * @access  Private (Teacher)
 */
router.get('/:courseId/certificates', protect, authorize('teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const certificates = await Certificate.find({
      courseId: req.params.courseId
    }).sort({ issueDate: -1 });
    
    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates'
    });
  }
});

// ADMIN ROUTE: Seed dummy courses (For development only!)
router.post('/seed-dummy-courses', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    // Check if courses already exist
    const existingCount = await Course.countDocuments();
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Database already has ${existingCount} courses. No seeding needed.`,
        count: existingCount
      });
    }

    // Get the teacher ID (from logged-in user)
    const teacherId = req.user._id;
    const teacherName = req.user.name;

    // 25 dummy courses
    const dummyCourses = [
      {
        title: 'Complete Python Programming',
        description: 'Master Python from basics to advanced concepts including OOP, data structures, and real-world projects.',
        category: 'Programming',
        level: 'Beginner',
        estimatedDuration: 40,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Introduction to Python', url: 'https://example.com/video1.mp4', duration: 15 },
          { title: 'Python Basics', url: 'https://example.com/video2.mp4', duration: 20 },
          { title: 'Data Structures in Python', url: 'https://example.com/video3.mp4', duration: 25 }
        ]
      },
      {
        title: 'Full Stack MERN Development',
        description: 'Build modern web applications using MongoDB, Express.js, React, and Node.js.',
        category: 'Web Development',
        level: 'Intermediate',
        estimatedDuration: 60,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'MERN Stack Overview', url: 'https://example.com/video1.mp4', duration: 10 },
          { title: 'Setting up MongoDB', url: 'https://example.com/video2.mp4', duration: 15 },
          { title: 'Building REST APIs', url: 'https://example.com/video3.mp4', duration: 30 }
        ]
      },
      {
        title: 'React.js Complete Guide',
        description: 'Learn React from scratch - components, hooks, state management, and advanced patterns.',
        category: 'Web Development',
        level: 'Intermediate',
        estimatedDuration: 45,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'React Basics', url: 'https://example.com/video1.mp4', duration: 20 },
          { title: 'React Hooks', url: 'https://example.com/video2.mp4', duration: 25 }
        ]
      },
      {
        title: 'Data Science with Python',
        description: 'Learn data analysis, visualization, and machine learning with Python libraries.',
        category: 'Data Science',
        level: 'Intermediate',
        estimatedDuration: 55,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Data Science Fundamentals', url: 'https://example.com/video1.mp4', duration: 30 }
        ]
      },
      {
        title: 'Machine Learning A-Z',
        description: 'Comprehensive machine learning course covering supervised, unsupervised learning and neural networks.',
        category: 'Machine Learning',
        level: 'Advanced',
        estimatedDuration: 70,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'ML Introduction', url: 'https://example.com/video1.mp4', duration: 35 }
        ]
      },
      {
        title: 'Android Development with Kotlin',
        description: 'Build native Android apps using Kotlin and modern Android development practices.',
        category: 'Mobile Development',
        level: 'Intermediate',
        estimatedDuration: 50,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Kotlin Basics', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'iOS Development with Swift',
        description: 'Create beautiful iOS apps using Swift and SwiftUI.',
        category: 'Mobile Development',
        level: 'Intermediate',
        estimatedDuration: 55,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Swift Fundamentals', url: 'https://example.com/video1.mp4', duration: 30 }
        ]
      },
      {
        title: 'Deep Learning with TensorFlow',
        description: 'Master deep learning and neural networks using TensorFlow 2.0.',
        category: 'Artificial Intelligence',
        level: 'Advanced',
        estimatedDuration: 80,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Deep Learning Basics', url: 'https://example.com/video1.mp4', duration: 40 }
        ]
      },
      {
        title: 'MongoDB Complete Guide',
        description: 'Learn NoSQL database design, queries, aggregation, and performance optimization.',
        category: 'Database',
        level: 'Intermediate',
        estimatedDuration: 30,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'MongoDB Basics', url: 'https://example.com/video1.mp4', duration: 20 }
        ]
      },
      {
        title: 'SQL for Data Analysis',
        description: 'Master SQL queries, joins, subqueries, and database design.',
        category: 'Database',
        level: 'Beginner',
        estimatedDuration: 25,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'SQL Fundamentals', url: 'https://example.com/video1.mp4', duration: 15 }
        ]
      },
      {
        title: 'AWS Cloud Essentials',
        description: 'Learn cloud computing with AWS - EC2, S3, Lambda, and more.',
        category: 'Cloud Computing',
        level: 'Beginner',
        estimatedDuration: 35,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'AWS Overview', url: 'https://example.com/video1.mp4', duration: 20 }
        ]
      },
      {
        title: 'Docker & Kubernetes',
        description: 'Master containerization and orchestration for modern applications.',
        category: 'DevOps',
        level: 'Advanced',
        estimatedDuration: 50,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Docker Basics', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'Ethical Hacking Basics',
        description: 'Learn penetration testing, vulnerability assessment, and security best practices.',
        category: 'Cybersecurity',
        level: 'Advanced',
        estimatedDuration: 60,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Ethical Hacking Intro', url: 'https://example.com/video1.mp4', duration: 30 }
        ]
      },
      {
        title: 'Computer Networking',
        description: 'Understand networking fundamentals, protocols, and network security.',
        category: 'Networking',
        level: 'Intermediate',
        estimatedDuration: 45,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Networking Basics', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'HTML5 & CSS3 Mastery',
        description: 'Create beautiful, responsive websites with modern HTML5 and CSS3.',
        category: 'Web Development',
        level: 'Beginner',
        estimatedDuration: 20,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'HTML Basics', url: 'https://example.com/video1.mp4', duration: 10 },
          { title: 'CSS Fundamentals', url: 'https://example.com/video2.mp4', duration: 10 }
        ]
      },
      {
        title: 'Java Programming Masterclass',
        description: 'Complete Java programming from basics to advanced OOP concepts.',
        category: 'Programming',
        level: 'Intermediate',
        estimatedDuration: 50,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Java Introduction', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'C++ Competitive Programming',
        description: 'Master algorithms, data structures, and competitive programming with C++.',
        category: 'Programming',
        level: 'Advanced',
        estimatedDuration: 35,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'C++ Basics', url: 'https://example.com/video1.mp4', duration: 20 }
        ]
      },
      {
        title: 'React Native Mobile Apps',
        description: 'Build cross-platform mobile apps using React Native.',
        category: 'Mobile Development',
        level: 'Intermediate',
        estimatedDuration: 40,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'React Native Setup', url: 'https://example.com/video1.mp4', duration: 20 }
        ]
      },
      {
        title: 'Natural Language Processing',
        description: 'Learn NLP techniques, sentiment analysis, and text processing with Python.',
        category: 'Artificial Intelligence',
        level: 'Advanced',
        estimatedDuration: 45,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'NLP Fundamentals', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'Microsoft Azure Fundamentals',
        description: 'Learn cloud services, Azure compute, storage, and networking.',
        category: 'Cloud Computing',
        level: 'Beginner',
        estimatedDuration: 30,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Azure Overview', url: 'https://example.com/video1.mp4', duration: 15 }
        ]
      },
      {
        title: 'CI/CD with Jenkins',
        description: 'Automate your software delivery pipeline with Jenkins.',
        category: 'DevOps',
        level: 'Intermediate',
        estimatedDuration: 35,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Jenkins Basics', url: 'https://example.com/video1.mp4', duration: 20 }
        ]
      },
      {
        title: 'Network Security',
        description: 'Learn network security, firewalls, VPNs, and threat detection.',
        category: 'Cybersecurity',
        level: 'Intermediate',
        estimatedDuration: 40,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Network Security Basics', url: 'https://example.com/video1.mp4', duration: 25 }
        ]
      },
      {
        title: 'JavaScript ES6+ Complete',
        description: 'Modern JavaScript - ES6+, async/await, promises, and more.',
        category: 'Web Development',
        level: 'Intermediate',
        estimatedDuration: 30,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'ES6 Features', url: 'https://example.com/video1.mp4', duration: 15 }
        ]
      },
      {
        title: 'Git & GitHub Mastery',
        description: 'Version control with Git, GitHub workflows, and collaboration.',
        category: 'DevOps',
        level: 'Beginner',
        estimatedDuration: 15,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Git Basics', url: 'https://example.com/video1.mp4', duration: 10 }
        ]
      },
      {
        title: 'Blockchain Development',
        description: 'Build decentralized applications with Ethereum and Solidity.',
        category: 'Other',
        level: 'Advanced',
        estimatedDuration: 50,
        teacherId,
        teacherName,
        published: true,
        videos: [
          { title: 'Blockchain Basics', url: 'https://example.com/video1.mp4', duration: 30 }
        ]
      }
    ];

    // Insert all courses
    const createdCourses = await Course.insertMany(dummyCourses);

    res.json({
      success: true,
      message: `Successfully created ${createdCourses.length} dummy courses!`,
      count: createdCourses.length,
      courses: createdCourses.map(c => ({ id: c._id, title: c.title, category: c.category }))
    });

  } catch (error) {
    console.error('Error seeding courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding courses',
      error: error.message
    });
  }
});

export default router;
