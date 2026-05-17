import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
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
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: String,
    default: 'Pass'
  },
  quizScore: {
    type: Number,
    default: 0
  },
  totalQuizMarks: {
    type: Number,
    default: 0
  }
});

// Indexes
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ empid: 1 });
certificateSchema.index({ courseId: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
