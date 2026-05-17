import mongoose from 'mongoose';

const videoProgressSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  watchedDuration: {
    type: Number, // in seconds
    default: 0
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
});

const quizAttemptSchema = new mongoose.Schema({
  attemptDate: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: String,
    answer: String,
    isCorrect: Boolean
  }]
});

const courseEnrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  empid: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  videoProgress: [videoProgressSchema],
  quizAttempts: [quizAttemptSchema],
  overallProgress: {
    type: Number, // Percentage 0-100
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date
  },
  certificateGenerated: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
courseEnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
courseEnrollmentSchema.index({ empid: 1 });
courseEnrollmentSchema.index({ completed: 1 });

// Calculate overall progress before saving
courseEnrollmentSchema.pre('save', function(next) {
  this.lastAccessedAt = Date.now();
  next();
});

const CourseEnrollment = mongoose.model('CourseEnrollment', courseEnrollmentSchema);

export default CourseEnrollment;
