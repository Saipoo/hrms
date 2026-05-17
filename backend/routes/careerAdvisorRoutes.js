import express from 'express';
import CareerProfile from '../models/CareerProfile.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Grade from '../models/Grade.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  analyzeCareerPaths,
  analyzeSkillGaps,
  generateResume,
  calculateReadinessScore,
  analyzeQuizResults,
  generateCareerRoadmap,
  parseResume
} from '../services/careerAdvisorAIService.js';
import multer from 'multer';
import { extractTextFromPDF, extractTextFromDOCX } from '../utils/textExtractor.js';

// Multer config for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// ==================== EMPLOYEE CAREER ROADMAP ====================

// @desc    Generate Employee Career Roadmap
// @route   POST /api/career/employee-roadmap
// @access  Private (Employee)
router.post('/employee-roadmap', protect, async (req, res) => {
  try {
    const { currentRole, targetRole, skills } = req.body;
    
    // Dynamically import AIService to avoid top-level dependency loops if any
    const AIServiceModule = await import('../services/AIService.js');
    const aiService = AIServiceModule.default;
    aiService.init();

    const prompt = `You are an expert HR Career Advisor. An employee has the current role: "${currentRole}". Their target future role is: "${targetRole}". Their current skills are: "${skills}". Generate a professional, step-by-step career upskilling roadmap for them to achieve this target role. Format it clearly using Markdown with headers, bullet points, and actionable advice. Return the markdown as a plain string.`;

    const result = await aiService.generateContent(prompt, { 
      systemPrompt: "You are an HR Career Advisor.",
      jsonMode: false 
    });

    res.status(200).json({ success: true, roadmap: result });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ success: false, message: 'Failed to generate roadmap', error: error.message });
  }
});

// ==================== CAREER PROFILE CRUD ====================

// @desc    Create or get career profile
// @route   POST /api/career/profile
// @access  Private (Student)
router.post('/profile', protect, authorize('student'), async (req, res) => {
  try {
    // Check if profile already exists
    let careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (careerProfile) {
      return res.status(200).json({
        success: true,
        message: 'Career profile already exists',
        data: careerProfile
      });
    }

    // Create new career profile
    const { interests, preferences } = req.body;

    careerProfile = await CareerProfile.create({
      empid: req.user.empid,
      studentName: req.user.name,
      email: req.user.email,
      interests: interests || [],
      preferences: preferences || {}
    });

    res.status(201).json({
      success: true,
      message: 'Career profile created successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error creating career profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create career profile',
      error: error.message
    });
  }
});

// @desc    Get student's career profile
// @route   GET /api/career/profile
// @access  Private (Student, Parent, Teacher)
router.get('/profile', protect, authorize('student', 'parent', 'teacher'), async (req, res) => {
  try {
    if (req.user.role === 'student') {
      empid = req.user.empid;
    } else {
      empid = req.query.empid;
      
      if (!empid) {
        return res.status(400).json({
          success: false,
          message: 'EmpID is required for non-employee users'
        });
      }
    }

    const careerProfile = await CareerProfile.findOne({ empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found. Please create one first.'
      });
    }

    // Check parent visibility settings
    if (req.user.role === 'parent') {
      const visibleData = {
        usn: careerProfile.usn,
        studentName: careerProfile.studentName,
        chosenPaths: careerProfile.parentVisibility.showCareerPaths ? careerProfile.chosenPaths : [],
        readinessScore: careerProfile.parentVisibility.showReadinessScore ? careerProfile.readinessScore : null,
        skillGaps: careerProfile.parentVisibility.showSkillGaps ? careerProfile.skillGaps : [],
        goals: careerProfile.goals
      };

      return res.status(200).json({
        success: true,
        data: visibleData
      });
    }

    // Format recommendedPaths to flatten nested structure for frontend
    const profileData = careerProfile.toObject();
    if (profileData.recommendedPaths && profileData.recommendedPaths.length > 0) {
      profileData.recommendedPaths = profileData.recommendedPaths.map(rp => ({
        ...rp.path,
        matchScore: rp.matchScore,
        reasoning: rp.reasoning,
        generatedAt: rp.generatedAt
      }));
    }

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching career profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career profile',
      error: error.message
    });
  }
});

// @desc    Update career profile
// @route   PUT /api/career/profile
// @access  Private (Student)
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Update allowed fields
    const { interests, preferences, parentVisibility } = req.body;
    
    if (interests) careerProfile.interests = interests;
    if (preferences) careerProfile.preferences = { ...careerProfile.preferences, ...preferences };
    if (parentVisibility) careerProfile.parentVisibility = { ...careerProfile.parentVisibility, ...parentVisibility };

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Career profile updated successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error updating career profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update career profile',
      error: error.message
    });
  }
});

// ==================== AI CAREER ANALYSIS ====================

// @desc    Analyze career paths using AI
// @route   POST /api/career/analyze
// @access  Private (Student)
router.post('/analyze', protect, authorize('student'), async (req, res) => {
  try {
    let careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      // Create profile if doesn't exist
      careerProfile = await CareerProfile.create({
        empid: req.user.empid,
        studentName: req.user.name,
        email: req.user.email
      });
    }

    // Prepare employee data for AI
    const employeeData = {
      empid: req.user.empid,
      name: req.user.name,
      interests: careerProfile.interests,
      currentSkills: careerProfile.currentSkills,
      integrationData: careerProfile.integrationData
    };

    // Analyze career paths using AI
    const careerPathsResult = await analyzeCareerPaths(employeeData);
    
    // Check if analysis was successful
    if (!careerPathsResult.success || !careerPathsResult.recommendations) {
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze career paths',
        error: careerPathsResult.error || 'No recommendations generated'
      });
    }

    const careerPaths = careerPathsResult.recommendations;

    console.log('AI returned paths:', JSON.stringify(careerPaths, null, 2));

    // Validate and save recommended paths with nested structure matching schema
    // AI returns: { path: {...}, matchScore: ..., reasoning: ... }
    careerProfile.recommendedPaths = careerPaths.map(rec => {
      const pathData = rec.path || rec; // Handle both formats
      
      // Ensure we have a valid title
      if (!pathData.title) {
        console.error('Path missing title:', rec);
        throw new Error('AI returned career path without title');
      }

      return {
        path: {
          title: pathData.title,
          description: pathData.description || 'Career path in technology/engineering',
          requiredSkills: Array.isArray(pathData.requiredSkills) ? pathData.requiredSkills : [],
          optionalSkills: Array.isArray(pathData.optionalSkills) ? pathData.optionalSkills : [],
          salaryRange: pathData.averageSalary || pathData.salaryRange || { min: 300000, max: 1200000, currency: 'INR' },
          topCompanies: Array.isArray(pathData.topCompanies) ? pathData.topCompanies : [],
          status: 'recommended'
        },
        matchScore: rec.matchScore || 0,
        reasoning: rec.reasoning || 'AI-generated career path recommendation',
        generatedAt: new Date()
      };
    });

    await careerProfile.save();

    // Return paths in the format frontend expects
    const formattedPaths = careerProfile.recommendedPaths.map(rp => ({
      ...rp.path,
      matchScore: rp.matchScore,
      reasoning: rp.reasoning
    }));

    res.status(200).json({
      success: true,
      message: 'Career paths analyzed successfully',
      data: formattedPaths
    });
  } catch (error) {
    console.error('Error analyzing career paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze career paths',
      error: error.message
    });
  }
});

// @desc    Get career recommendations
// @route   GET /api/career/recommendations
// @access  Private (Student)
router.get('/recommendations', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found. Please create one first.'
      });
    }

    // Return recommended paths (flatten nested structure for frontend)
    const formattedPaths = careerProfile.recommendedPaths.map(rp => ({
      ...rp.path,
      matchScore: rp.matchScore,
      reasoning: rp.reasoning,
      generatedAt: rp.generatedAt
    }));
    
    const sortedPaths = formattedPaths.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      data: sortedPaths
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

// @desc    Choose a career path
// @route   POST /api/career/choose-path
// @access  Private (Student)
router.post('/choose-path', protect, authorize('student'), async (req, res) => {
  try {
    const { pathTitle, targetDate } = req.body;

    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Find the path in recommended paths (note: recommendedPaths has nested 'path' object)
    const recommendedPathObj = careerProfile.recommendedPaths.find(p => p.path?.title === pathTitle);

    if (!recommendedPathObj) {
      console.log('Available paths:', careerProfile.recommendedPaths.map(p => p.path?.title || 'no title'));
      console.log('Searching for:', pathTitle);
      return res.status(404).json({
        success: false,
        message: 'Career path not found in recommendations'
      });
    }

    const recommendedPath = recommendedPathObj.path;

    // Validate that we have the required data
    if (!recommendedPath || !recommendedPath.title) {
      console.error('Recommended path is invalid:', recommendedPath);
      return res.status(400).json({
        success: false,
        message: 'Invalid career path data'
      });
    }

    // Check if already chosen
    const alreadyChosen = careerProfile.chosenPaths.find(p => p.title === pathTitle);

    if (alreadyChosen) {
      return res.status(400).json({
        success: false,
        message: 'Career path already chosen'
      });
    }

    // Add to chosen paths with all required fields
    careerProfile.chosenPaths.push({
      title: recommendedPath.title,
      description: recommendedPath.description || 'Career path description',
      targetDate: targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default: 1 year
      requiredSkills: recommendedPath.requiredSkills || [],
      optionalSkills: recommendedPath.optionalSkills || [],
      salaryRange: recommendedPath.salaryRange || { min: 300000, max: 1200000, currency: 'INR' },
      topCompanies: recommendedPath.topCompanies || [],
      status: 'in-progress'
    });

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Career path chosen successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error choosing career path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to choose career path',
      error: error.message
    });
  }
});

// ==================== SKILL GAP ANALYSIS ====================

// @desc    Analyze skill gaps for chosen career path
// @route   POST /api/career/analyze-skills
// @access  Private (Student)
router.post('/analyze-skills', protect, authorize('student'), async (req, res) => {
  try {
    const { careerPath } = req.body;

    if (!careerPath) {
      return res.status(400).json({
        success: false,
        message: 'Career path is required'
      });
    }

    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Prepare current profile for AI
    const currentProfile = {
      currentSkills: careerProfile.currentSkills,
      integrationData: careerProfile.integrationData,
      completedCourses: careerProfile.integrationData.courseMaster.completedCourses
    };

    // Analyze skill gaps using AI
    const skillGapAnalysis = await analyzeSkillGaps(currentProfile, careerPath);

    // Update skill gaps in profile
    careerProfile.skillGaps = skillGapAnalysis.map(gap => ({
      skill: gap.skill,
      currentLevel: gap.currentLevel || 'beginner',
      requiredLevel: gap.requiredLevel,
      importance: gap.importance,
      estimatedTime: gap.estimatedTime,
      resources: gap.resources.map(r => ({
        type: r.type,
        title: r.title,
        url: r.url,
        description: r.description
      }))
    }));

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Skill gaps analyzed successfully',
      data: skillGapAnalysis
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze skill gaps',
      error: error.message
    });
  }
});

// @desc    Get skill gaps
// @route   GET /api/career/skill-gaps
// @access  Private (Student)
router.get('/skill-gaps', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Sort by importance
    const sortedGaps = careerProfile.skillGaps.sort((a, b) => {
      const importanceOrder = { required: 3, recommended: 2, optional: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    res.status(200).json({
      success: true,
      data: sortedGaps
    });
  } catch (error) {
    console.error('Error fetching skill gaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill gaps',
      error: error.message
    });
  }
});

// @desc    Update skill progress
// @route   PUT /api/career/skill-progress
// @access  Private (Student)
router.put('/skill-progress', protect, authorize('student'), async (req, res) => {
  try {
    const { skillName, progress } = req.body;

    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Find and update skill gap
    const skillGap = careerProfile.skillGaps.find(g => g.skill === skillName);

    if (!skillGap) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found in gaps'
      });
    }

    skillGap.progress = progress;

    // Also update in current skills if high progress
    if (progress >= 50) {
      const existingSkill = careerProfile.currentSkills.find(s => s.name === skillName);
      
      if (existingSkill) {
        existingSkill.level = progress >= 80 ? 'advanced' : 'intermediate';
      } else {
        careerProfile.currentSkills.push({
          name: skillName,
          level: progress >= 80 ? 'advanced' : 'intermediate',
          acquiredDate: new Date()
        });
      }
    }

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Skill progress updated successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error updating skill progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill progress',
      error: error.message
    });
  }
});

// ==================== RESUME GENERATION ====================

// @desc    Generate AI resume
// @route   POST /api/career/resume/generate
// @access  Private (Student)
router.post('/resume/generate', protect, authorize('student'), async (req, res) => {
  try {
    const { template, jobDescription, userDetails } = req.body;
    let careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      careerProfile = await CareerProfile.create({
        empid: req.user.empid,
        studentName: req.user.name,
        email: req.user.email
      });
    }

    // Sync integration data
    await careerProfile.syncIntegrationData();

    // Prepare student profile for AI (Merge DB data with manual userDetails)
    const studentProfile = {
      name: userDetails?.name || careerProfile.studentName,
      email: careerProfile.email,
      experience: userDetails?.experience || '',
      education: userDetails?.education || '',
      skills: userDetails?.skills || careerProfile.currentSkills?.map(s => s.name).join(', '),
      targetJobDescription: jobDescription || '',
      integrationData: careerProfile.integrationData,
      chosenPaths: careerProfile.chosenPaths
    };

    // Generate resume using AI
    const generatedResume = await generateResume(studentProfile);

    // Update resume in profile
    careerProfile.resume = {
      summary: (generatedResume.resume || generatedResume).summary || '',
      education: (generatedResume.resume || generatedResume).education || [],
      experience: (generatedResume.resume || generatedResume).experience || [],
      projects: (generatedResume.resume || generatedResume).projects || [],
      certifications: (generatedResume.resume || generatedResume).certifications || [],
      skills: (generatedResume.resume || generatedResume).skills || [],
      achievements: (generatedResume.resume || generatedResume).achievements || [],
      lastGenerated: new Date()
    };

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Resume generated successfully',
      data: careerProfile.resume
    });
  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
});

// @desc    Optimize resume based on job description
// @route   POST /api/career/resume/optimize
// @access  Private (Student)
router.post('/resume/optimize', protect, authorize('student'), async (req, res) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    
    if (!resumeContent || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Resume content and Job Description are required'
      });
    }

    const { optimizeResume } = await import('../services/careerAdvisorAIService.js');
    const result = await optimizeResume(resumeContent, jobDescription);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error optimizing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize resume',
      error: error.message
    });
  }
});

// @desc    Parse uploaded resume (PDF/DOCX)
// @route   POST /api/career/resume/parse
// @access  Private (Student)
router.post('/resume/parse', protect, authorize('student'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, mimetype, originalname } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      text = await extractTextFromPDF(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimetype === 'application/msword') {
      text = await extractTextFromDOCX(buffer);
    } else if (mimetype === 'text/plain') {
      text = buffer.toString('utf8');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload PDF, DOCX, or TXT.'
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from file'
      });
    }

    const result = await parseResume(text.substring(0, 10000), mimetype); // Pass text to AI

    res.status(200).json(result);
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse resume',
      error: error.message
    });
  }
});

// @desc    Get resume
// @route   GET /api/career/resume
// @access  Private (Student, Parent with permission)
router.get('/resume', protect, authorize('student', 'parent'), async (req, res) => {
  try {
    let empid;
    if (req.user.role === 'student') {
      empid = req.user.empid;
    } else {
      empid = req.query.empid;
      
      if (!empid) {
        return res.status(400).json({
          success: false,
          message: 'EmpID is required for non-employee users'
        });
      }
    }

    const careerProfile = await CareerProfile.findOne({ empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Check parent permission
    if (req.user.role === 'parent' && !careerProfile.parentVisibility.showResume) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view resume'
      });
    }

    res.status(200).json({
      success: true,
      data: careerProfile.resume
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

// @desc    Update resume manually
// @route   PUT /api/career/resume
// @access  Private (Student)
router.put('/resume', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Update resume fields
    const { summary, education, experience, projects, certifications, skills, achievements } = req.body;
    
    if (summary) careerProfile.resume.summary = summary;
    if (education) careerProfile.resume.education = education;
    if (experience) careerProfile.resume.experience = experience;
    if (projects) careerProfile.resume.projects = projects;
    if (certifications) careerProfile.resume.certifications = certifications;
    if (skills) careerProfile.resume.skills = skills;
    if (achievements) careerProfile.resume.achievements = achievements;

    careerProfile.resume.lastUpdated = new Date();

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      data: careerProfile.resume
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume',
      error: error.message
    });
  }
});

// ==================== CAREER QUIZ ====================

// @desc    Submit career quiz
// @route   POST /api/career/quiz/:type
// @access  Private (Student)
router.post('/quiz/:type', protect, authorize('student'), async (req, res) => {
  try {
    const { type } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Quiz answers are required'
      });
    }

    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Analyze quiz results using AI
    const quizAnalysis = await analyzeQuizResults(answers, type);

    // Save quiz result
    careerProfile.quizResults.push({
      type,
      answers,
      results: quizAnalysis,
      completedAt: new Date()
    });

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: quizAnalysis
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
});

// @desc    Get quiz results
// @route   GET /api/career/quiz-results
// @access  Private (Student)
router.get('/quiz-results', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: careerProfile.quizResults
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: error.message
    });
  }
});

// ==================== MENTOR CONNECTIONS ====================

// @desc    Connect with mentor
// @route   POST /api/career/connect-mentor
// @access  Private (Student)
router.post('/connect-mentor', protect, authorize('student'), async (req, res) => {
  try {
    const { mentorEmail, careerPath, message } = req.body;

    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Find mentor (teacher)
    const mentor = await Teacher.findOne({ email: mentorEmail });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Add mentor connection
    careerProfile.mentorConnections.push({
      mentorId: mentor._id,
      mentorName: mentor.name,
      mentorEmail: mentor.email,
      careerPath,
      message,
      status: 'pending'
    });

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Mentor connection request sent successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error connecting with mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect with mentor',
      error: error.message
    });
  }
});

// @desc    Get mentor connections
// @route   GET /api/career/mentor-connections
// @access  Private (Student)
router.get('/mentor-connections', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: careerProfile.mentorConnections
    });
  } catch (error) {
    console.error('Error fetching mentor connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentor connections',
      error: error.message
    });
  }
});

// ==================== READINESS SCORE ====================

// @desc    Calculate career readiness score
// @route   GET /api/career/readiness-score
// @access  Private (Student, Parent with permission)
router.get('/readiness-score', protect, authorize('student', 'parent'), async (req, res) => {
  try {
    if (req.user.role === 'student') {
      empid = req.user.empid;
    } else {
      empid = req.query.empid;
      
      if (!empid) {
        return res.status(400).json({
          success: false,
          message: 'EmpID is required for non-employee users'
        });
      }
    }

    const careerProfile = await CareerProfile.findOne({ empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Check parent permission
    if (req.user.role === 'parent' && !careerProfile.parentVisibility.showReadinessScore) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view readiness score'
      });
    }

    // Get target career path
    const targetPath = req.query.careerPath || (careerProfile.chosenPaths[0] && careerProfile.chosenPaths[0].title);

    if (!targetPath) {
      return res.status(400).json({
        success: false,
        message: 'No career path specified'
      });
    }

    // Sync integration data
    await careerProfile.syncIntegrationData();

    // Calculate readiness score using AI
    const studentProfile = {
      currentSkills: careerProfile.currentSkills,
      integrationData: careerProfile.integrationData,
      skillGaps: careerProfile.skillGaps,
      quizResults: careerProfile.quizResults
    };

    const readinessAnalysis = await calculateReadinessScore(studentProfile, targetPath);

    // Update readiness score in profile
    careerProfile.readinessScore = {
      overall: readinessAnalysis.overall,
      technical: readinessAnalysis.breakdown.technical,
      softSkills: readinessAnalysis.breakdown.softSkills,
      experience: readinessAnalysis.breakdown.experience,
      lastCalculated: new Date()
    };

    await careerProfile.save();

    res.status(200).json({
      success: true,
      data: readinessAnalysis
    });
  } catch (error) {
    console.error('Error calculating readiness score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate readiness score',
      error: error.message
    });
  }
});

// ==================== CAREER ROADMAP ====================

// @desc    Generate career roadmap
// @route   GET /api/career/roadmap
// @access  Private (Student)
router.get('/roadmap', protect, authorize('student'), async (req, res) => {
  try {
    const { careerPath, timeframe = 12 } = req.query;

    if (!careerPath) {
      return res.status(400).json({
        success: false,
        message: 'Career path is required'
      });
    }

    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Sync integration data
    await careerProfile.syncIntegrationData();

    // Prepare student profile for AI
    const studentProfile = {
      currentSkills: careerProfile.currentSkills,
      skillGaps: careerProfile.skillGaps,
      integrationData: careerProfile.integrationData,
      goals: careerProfile.goals
    };

    // Generate roadmap using AI
    const roadmap = await generateCareerRoadmap(studentProfile, careerPath, parseInt(timeframe));

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap',
      error: error.message
    });
  }
});

// ==================== INTEGRATION & SYNC ====================

// @desc    Sync data from all modules
// @route   POST /api/career/sync-data
// @access  Private (Student)
router.post('/sync-data', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Sync integration data
    await careerProfile.syncIntegrationData();

    res.status(200).json({
      success: true,
      message: 'Data synced successfully',
      data: careerProfile.integrationData
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync data',
      error: error.message
    });
  }
});

// ==================== GOALS ====================

// @desc    Add career goal
// @route   POST /api/career/goal
// @access  Private (Student)
router.post('/goal', protect, authorize('student'), async (req, res) => {
  try {
    const { title, description, type, targetDate, milestones } = req.body;

    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    careerProfile.goals.push({
      title,
      description,
      type: type || 'short-term',
      targetDate: targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default: 3 months
      milestones: milestones || []
    });

    await careerProfile.save();

    res.status(201).json({
      success: true,
      message: 'Goal added successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add goal',
      error: error.message
    });
  }
});

// @desc    Update goal progress
// @route   PUT /api/career/goal/:goalId
// @access  Private (Student)
router.put('/goal/:goalId', protect, authorize('student'), async (req, res) => {
  try {
    const { progress, status } = req.body;

    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    const goal = careerProfile.goals.id(req.params.goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (progress !== undefined) goal.progress = progress;
    if (status) goal.status = status;

    if (status === 'completed') {
      goal.completedAt = new Date();
    }

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: careerProfile
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
});

// ==================== DASHBOARD ====================

// @desc    Get career dashboard overview
// @route   GET /api/career/dashboard
// @access  Private (Student)
router.get('/dashboard', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found. Please create one first.'
      });
    }

    // Sync data
    await careerProfile.syncIntegrationData();

    // Get readiness score if chosen path exists
    let readinessAnalysis = null;
    if (careerProfile.chosenPaths.length > 0) {
      const targetPath = careerProfile.chosenPaths[0].title;
      
      const studentProfile = {
        currentSkills: careerProfile.currentSkills,
        integrationData: careerProfile.integrationData,
        skillGaps: careerProfile.skillGaps,
        quizResults: careerProfile.quizResults
      };

      readinessAnalysis = await calculateReadinessScore(studentProfile, targetPath);
    }

    // Flatten recommendedPaths structure for frontend (extract path object from nested structure)
    const topRecommendations = (careerProfile.recommendedPaths || [])
      .slice(0, 3)
      .map(rec => {
        // Handle nested structure: { path: {...}, matchScore, reasoning }
        const pathData = rec.path || rec;
        return {
          ...pathData,
          matchScore: rec.matchScore || pathData.matchScore,
          reasoning: rec.reasoning || pathData.reasoning
        };
      });

    res.status(200).json({
      success: true,
      data: {
        profile: careerProfile,
        topRecommendations,
        criticalSkillGaps: (careerProfile.skillGaps || []).filter(g => g.importance === 'required').slice(0, 5),
        readinessScore: readinessAnalysis,
        recentQuizzes: (careerProfile.quizResults || []).slice(-3),
        activeGoals: (careerProfile.goals || []).filter(g => g.status !== 'completed')
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// ==================== AI CAREER CHAT ====================

// @desc    Chat with AI career advisor
// @route   POST /api/career/chat
// @access  Private (Student)
router.post('/chat', protect, authorize('student'), async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get student's career profile for context
    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });
    const student = await Student.findOne({ usn: req.user.usn });

    // Build context for AI
    const studentContext = {
      name: req.user.name,
      semester: student?.semester || 'N/A',
      course: student?.course || 'N/A',
      interests: careerProfile?.interests || [],
      chosenPaths: careerProfile?.chosenPaths || [],
      skills: careerProfile?.skills || [],
      skillGaps: careerProfile?.skillGaps || [],
      readinessScore: careerProfile?.readinessScore || null
    };

    // Call AI service for conversational response
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation context
    let conversationHistory = '';
    if (chatHistory && chatHistory.length > 0) {
      conversationHistory = chatHistory.map(msg => 
        `${msg.role === 'user' ? 'Student' : 'AI Career Advisor'}: ${msg.content}`
      ).join('\n');
    }

    const prompt = `You are an expert AI Career Advisor helping a student with their career planning.

Student Context:
- Name: ${studentContext.name}
- Course: ${studentContext.course}, Semester: ${studentContext.semester}
- Interests: ${studentContext.interests.join(', ') || 'Not specified'}
- Chosen Career Paths: ${studentContext.chosenPaths.map(p => p.title).join(', ') || 'None chosen yet'}
- Current Skills: ${studentContext.skills.map(s => s.name).join(', ') || 'No skills recorded'}
- Career Readiness Score: ${studentContext.readinessScore ? `${studentContext.readinessScore.overall}/100` : 'Not calculated'}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n` : ''}

Student's Current Question: ${message}

Provide a helpful, personalized, and actionable response. Be encouraging and specific. If suggesting resources or actions, make them concrete and achievable. Keep responses concise (2-4 paragraphs max).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    // Save chat to career profile
    if (careerProfile) {
      if (!careerProfile.chatHistory) {
        careerProfile.chatHistory = [];
      }

      careerProfile.chatHistory.push({
        userMessage: message,
        aiResponse: aiResponse,
        timestamp: new Date()
      });

      // Keep only last 50 messages to avoid document size issues
      if (careerProfile.chatHistory.length > 50) {
        careerProfile.chatHistory = careerProfile.chatHistory.slice(-50);
      }

      await careerProfile.save();
    }

    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message
    });
  }
});

// ==================== ADVANCED RESUME BUILDER ====================

// @desc    Generate resume from scratch with AI
// @route   POST /api/career/resume/generate
// @access  Private (Student)
router.post('/resume/generate', protect, authorize('student'), async (req, res) => {
  try {
    const { template, jobDescription, customSections } = req.body;

    // Get student and career profile data (removed populate as currentCourse doesn't exist)
    const student = await Student.findOne({ usn: req.user.usn });
    const careerProfile = await CareerProfile.findOne({ usn: req.user.usn });
    const grades = await Grade.find({ usn: req.user.usn }).sort({ createdAt: -1 }).limit(10);

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found. Please create one first.'
      });
    }

    // Prepare student data for AI
    const studentData = {
      name: req.user.name,
      email: req.user.email,
      usn: req.user.usn,
      course: student?.course || 'N/A',
      semester: student?.semester || 'N/A',
      skills: careerProfile.skills || [],
      chosenPaths: careerProfile.chosenPaths || [],
      interests: careerProfile.interests || [],
      achievements: customSections?.achievements || [],
      projects: customSections?.projects || [],
      experience: customSections?.experience || [],
      certifications: customSections?.certifications || [],
      grades: grades.map(g => ({
        subject: g.subject,
        percentage: ((g.marks / g.totalMarks) * 100).toFixed(1)
      }))
    };

    // Call AI to generate resume content
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert resume writer. Generate a professional, ATS-optimized resume based on the following information.

Student Profile:
- Name: ${studentData.name}
- Email: ${studentData.email}
- Course: ${studentData.course}, Semester: ${studentData.semester}
- Skills: ${studentData.skills.map(s => s.name).join(', ') || 'No skills listed'}
- Career Paths: ${studentData.chosenPaths.map(p => p.title).join(', ') || 'None chosen'}
- Interests: ${studentData.interests.join(', ') || 'Not specified'}

${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Template Style: ${template || 'Modern'}

Generate a resume with these sections:
1. Professional Summary (3-4 impactful sentences)
2. Technical Skills (categorized)
3. Education (with GPA/percentage)
4. Projects (3-4 impressive projects with quantifiable results)
5. Experience (if any internships/work)
6. Certifications & Achievements
7. Leadership & Extracurriculars

Requirements:
- Use action verbs (Led, Developed, Implemented, Achieved)
- Include quantifiable metrics (improved by X%, reduced by Y)
- Optimize keywords for ATS based on job description
- Keep it to 1 page
- Professional tone

Return a JSON object with this structure:
{
  "summary": "Professional summary text",
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"]
  },
  "education": [{
    "degree": "degree name",
    "institution": "institution name",
    "year": "year",
    "gpa": "gpa/percentage"
  }],
  "projects": [{
    "title": "project name",
    "description": "description with metrics",
    "technologies": ["tech1", "tech2"],
    "achievements": ["achievement1", "achievement2"]
  }],
  "experience": [{
    "title": "position",
    "company": "company name",
    "duration": "duration",
    "responsibilities": ["resp1", "resp2"]
  }],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1", "achievement2"]
}

IMPORTANT: Return ONLY the JSON object, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse resume from AI response');
    }
    
    const resumeData = JSON.parse(jsonMatch[0]);

    // Save resume to career profile
    const newResume = {
      template: template || 'modern',
      content: resumeData,
      jobDescription: jobDescription || '',
      generatedAt: new Date(),
      lastModified: new Date()
    };

    if (!careerProfile.resumes) {
      careerProfile.resumes = [];
    }
    
    careerProfile.resumes.push(newResume);
    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Resume generated successfully',
      data: newResume
    });
  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
});

// @desc    Optimize existing resume
// @route   POST /api/career/resume/optimize
// @access  Private (Student)
router.post('/resume/optimize', protect, authorize('student'), async (req, res) => {
  try {
    const { resumeContent, jobDescription } = req.body;

    if (!resumeContent) {
      return res.status(400).json({
        success: false,
        message: 'Resume content is required'
      });
    }

    // Call AI to optimize resume
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert resume optimizer. Analyze and improve the following resume to make it ATS-friendly and impactful.

Current Resume:
${JSON.stringify(resumeContent, null, 2)}

${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Provide optimization suggestions in these categories:
1. ATS Keywords (missing keywords from job description)
2. Action Verbs (replace weak verbs with strong ones)
3. Quantifiable Metrics (add numbers and percentages)
4. Formatting Issues (ATS-unfriendly elements)
5. Content Improvements (what to add/remove)

Return a JSON object:
{
  "optimizedResume": { ...optimized resume in same structure... },
  "suggestions": {
    "keywords": ["keyword1", "keyword2"],
    "actionVerbs": [{"old": "did", "new": "implemented"}],
    "metrics": ["Add percentage improvement in project X"],
    "formatting": ["Issue and fix"],
    "content": ["Suggestion 1", "Suggestion 2"]
  },
  "atsScore": 85
}

IMPORTANT: Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse optimization from AI response');
    }
    
    const optimizationData = JSON.parse(jsonMatch[0]);

    res.status(200).json({
      success: true,
      message: 'Resume optimized successfully',
      data: optimizationData
    });
  } catch (error) {
    console.error('Error optimizing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize resume',
      error: error.message
    });
  }
});

// @desc    Get resume suggestions while typing
// @route   POST /api/career/resume/suggest
// @access  Private (Student)
router.post('/resume/suggest', protect, authorize('student'), async (req, res) => {
  try {
    const { section, currentText, context } = req.body;
    
    if (!section || !currentText) {
      return res.status(400).json({
        success: false,
        message: 'Section and Current Text are required'
      });
    }

    const { default: AIService } = await import('../services/AIService.js');

    const prompt = `You are a professional resume writing assistant. Provide 3-5 suggestions to improve this resume section for an HRMS profile.

Section: ${section}
Current Text: ${currentText}
Context/Job Description: ${context || 'General professional improvement'}

Provide actionable suggestions with:
- Stronger action verbs
- Quantifiable metrics (impact)
- ATS-optimized keywords
- Corporate tone

Return a JSON array of 3-5 strings only.`;

    const suggestions = await AIService.generateContent(prompt, { jsonMode: true });

    res.status(200).json({
      success: true,
      data: Array.isArray(suggestions) ? suggestions : []
    });
  } catch (error) {
    console.error('Error getting resume suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
});

// @desc    Get all saved resumes
// @route   GET /api/career/resume/list
// @access  Private (Student)
router.get('/resume/list', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: careerProfile.resumes || []
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
});

// @desc    Delete a resume
// @route   DELETE /api/career/resume/:id
// @access  Private (Student)
router.delete('/resume/:id', protect, authorize('student'), async (req, res) => {
  try {
    const careerProfile = await CareerProfile.findOne({ empid: req.user.empid });

    if (!careerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    careerProfile.resumes = careerProfile.resumes.filter(
      r => r._id.toString() !== req.params.id
    );

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume',
      error: error.message
    });
  }
});

export default router;
