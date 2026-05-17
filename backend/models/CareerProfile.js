import mongoose from 'mongoose';

const careerPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['software', 'data', 'design', 'business', 'research', 'hardware', 'other']
  },
  requiredSkills: [String],
  optionalSkills: [String],
  averageSalary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  topCompanies: [String],
  growthRate: String,
  workEnvironment: String,
  educationRequired: String,
  certifications: [String]
});

const skillGapSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft-skill', 'tool', 'language', 'framework', 'domain-knowledge']
  },
  importance: {
    type: String,
    enum: ['required', 'recommended', 'optional'],
    default: 'recommended'
  },
  currentLevel: {
    type: String,
    enum: ['none', 'beginner', 'intermediate', 'advanced'],
    default: 'none'
  },
  targetLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  resources: [{
    type: {
      type: String,
      enum: ['course', 'book', 'project', 'certification', 'practice']
    },
    title: String,
    url: String,
    platform: String,
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course' // Integration with CourseMaster
    }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedAt: Date
});

const careerQuizResultSchema = new mongoose.Schema({
  quizType: {
    type: String,
    enum: ['personality', 'aptitude', 'interest', 'skill-assessment'],
    required: true
  },
  score: Number,
  maxScore: Number,
  answers: [{
    question: String,
    answer: String,
    category: String
  }],
  results: {
    primaryType: String,
    secondaryType: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const careerProfileSchema = new mongoose.Schema({
  empid: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Career Interests
  interests: [{
    area: String,
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  // Chosen Career Paths (can have multiple)
  chosenPaths: [careerPathSchema],
  
  // AI-Generated Recommendations
  recommendedPaths: [{
    path: careerPathSchema,
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    reasoning: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Skills Analysis
  currentSkills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    category: String,
    acquiredFrom: {
      type: String,
      enum: ['course', 'project', 'internship', 'self-learned', 'certification']
    },
    verifiedBy: String, // Teacher/Mentor name
    verifiedAt: Date
  }],
  
  // Skill Gaps
  skillGaps: [skillGapSchema],
  
  // Career Readiness
  readinessScore: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    technical: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    softSkills: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // AI Resume & Portfolio
  resume: {
    summary: String,
    aiGenerated: {
      type: Boolean,
      default: false
    },
    lastGenerated: Date,
    sections: {
      education: [{
        degree: String,
        institution: String,
        year: String,
        grade: String
      }],
      experience: [{
        title: String,
        company: String,
        duration: String,
        description: String,
        source: {
          type: String,
          enum: ['internship-simulator', 'real-internship', 'manual']
        }
      }],
      projects: [{
        title: String,
        description: String,
        technologies: [String],
        url: String,
        source: {
          type: String,
          enum: ['coursework', 'hackathon', 'personal', 'manual']
        }
      }],
      certifications: [{
        name: String,
        issuer: String,
        date: Date,
        url: String,
        source: {
          type: String,
          enum: ['coursemaster', 'external', 'manual']
        }
      }],
      skills: [String]
    }
  },
  
  // Career Quiz Results
  quizResults: [careerQuizResultSchema],
  
  // Mentor Connections
  mentorConnections: [{
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    careerPath: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'active', 'completed'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Integration Data (auto-populated)
  integrationData: {
    // From GradeMaster
    academicPerformance: {
      overallGPA: Number,
      subjectWiseGrades: {
        type: Map,
        of: Number
      },
      strongSubjects: [String],
      weakSubjects: [String],
      lastSynced: Date
    },
    
    // From CourseMaster
    completedCourses: [{
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      title: String,
      domain: String,
      completionDate: Date,
      grade: String
    }],
    
    // From Internship Simulator
    internshipExperience: [{
      internshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship'
      },
      title: String,
      domain: String,
      tasksCompleted: Number,
      rating: Number
    }],
    
    // From Interview Simulator
    interviewPerformance: {
      totalAttempts: Number,
      averageScore: Number,
      strongAreas: [String],
      improvementAreas: [String],
      lastSynced: Date
    }
  },
  
  // Goals & Milestones
  careerGoals: [{
    shortTerm: [String],
    mediumTerm: [String],
    longTerm: [String],
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    category: {
      type: String,
      enum: ['skill', 'certification', 'project', 'internship', 'job']
    }
  }],
  
  // Parent Visibility
  parentVisibility: {
    showCareerPaths: {
      type: Boolean,
      default: true
    },
    showReadinessScore: {
      type: Boolean,
      default: true
    },
    showSkillGaps: {
      type: Boolean,
      default: true
    },
    showResume: {
      type: Boolean,
      default: false
    }
  },
  
  lastAIAnalysis: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  },

  // AI Chat History
  chatHistory: [{
    userMessage: {
      type: String,
      required: true
    },
    aiResponse: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Resume Builder
  resumes: [{
    template: {
      type: String,
      enum: ['modern', 'classic', 'technical', 'creative'],
      default: 'modern'
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    jobDescription: String,
    generatedAt: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      default: Date.now
    }
  }]
  
}, { timestamps: true });

// Indexes
careerProfileSchema.index({ empid: 1 });
careerProfileSchema.index({ 'chosenPaths.title': 1 });

// Methods
careerProfileSchema.methods.calculateReadinessScore = function() {
  // Technical score (40%)
  const totalRequiredSkills = this.skillGaps.filter(sg => sg.importance === 'required').length;
  const learnedRequiredSkills = this.skillGaps.filter(sg => 
    sg.importance === 'required' && 
    sg.currentLevel !== 'none'
  ).length;
  
  const technical = totalRequiredSkills > 0 
    ? (learnedRequiredSkills / totalRequiredSkills) * 100 
    : 50;
  
  // Soft Skills score (20%) - from interview performance
  const softSkills = this.integrationData.interviewPerformance?.averageScore || 50;
  
  // Experience score (40%) - from completed courses, internships
  const courseCount = this.integrationData.completedCourses?.length || 0;
  const internshipCount = this.integrationData.internshipExperience?.length || 0;
  const experience = Math.min(((courseCount * 10) + (internshipCount * 30)), 100);
  
  // Calculate overall
  const overall = (technical * 0.4) + (softSkills * 0.2) + (experience * 0.4);
  
  this.readinessScore = {
    overall: Math.round(overall),
    technical: Math.round(technical),
    softSkills: Math.round(softSkills),
    experience: Math.round(experience),
    lastUpdated: new Date()
  };
  
  return this.readinessScore;
};

careerProfileSchema.methods.syncIntegrationData = async function() {
  // This method will be called to sync data from other modules
  // Implementation will be in the service layer
  this.lastAIAnalysis = new Date();
};

const CareerProfile = mongoose.model('CareerProfile', careerProfileSchema);

export default CareerProfile;
