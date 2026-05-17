import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
});

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'link'],
    required: true
  },
  url: {
    type: String,
    required: true
  }
});

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [String], // Only for multiple-choice
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Allow both String and Number
    required: true
  },
  marks: {
    type: Number,
    default: 1
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Leadership', 'Professional Skills', 'Technical Training', 'AI & Automation', 
           'Compliance', 'Wellbeing', 'Software Engineering', 'Data & Analytics', 
           'Product Management', 'Design', 'Other']
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  videos: [videoSchema],
  resources: [resourceSchema],
  quizzes: [quizQuestionSchema],
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  teacherDepartment: {
    type: String,
    default: ''
  },
  empid: {
    type: String,
    required: true
  },
  published: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 0
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
courseSchema.index({ published: 1, category: 1 });
courseSchema.index({ teacherId: 1 });
courseSchema.index({ createdAt: -1 });

// Update the updatedAt field on save
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
