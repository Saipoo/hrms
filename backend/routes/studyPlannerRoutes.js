import express from 'express';
import StudyPlan from '../models/StudyPlan.js';
import Grade from '../models/Grade.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateWeeklySchedule,
  analyzePerformanceGaps,
  generateRecommendations,
  optimizeFocusSession,
  generateSkillAdvancementTips
} from '../services/studyPlannerAIService.js';

const router = express.Router();

// ==================== STUDY PLAN CRUD ====================

// @desc    Create a new study plan
// @route   POST /api/study-planner/create
// @access  Private (Student)
router.post('/create', protect, authorize('student'), async (req, res) => {
  try {
    const { semester, academicYear, weeklyGoalHours, preferences } = req.body;

    // Check if plan already exists for this semester
    const existingPlan = await StudyPlan.findOne({
      empid: req.user.empid,
      semester,
      academicYear
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Study plan already exists for this semester. Use update endpoint.'
      });
    }

    // Create new study plan
    const studyPlan = await StudyPlan.create({
      empid: req.user.empid,
      studentName: req.user.name,
      semester,
      academicYear,
      weeklyGoalHours: weeklyGoalHours || 20,
      preferences: preferences || {}
    });

    res.status(201).json({
      success: true,
      message: 'Study plan created successfully',
      data: studyPlan
    });
  } catch (error) {
    console.error('Error creating study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study plan',
      error: error.message
    });
  }
});

// @desc    Get student's current study plan
// @route   GET /api/study-planner/my-plan
// @access  Private (Student)
router.get('/my-plan', protect, authorize('student'), async (req, res) => {
  try {
    const { semester, academicYear } = req.query;

    let query = { empid: req.user.empid };
    
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    const studyPlan = await StudyPlan.findOne(query).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found. Please create one first.'
      });
    }

    res.status(200).json({
      success: true,
      data: studyPlan
    });
  } catch (error) {
    console.error('Error fetching study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study plan',
      error: error.message
    });
  }
});

// @desc    Update study plan settings
// @route   PUT /api/study-planner/update/:id
// @access  Private (Student)
router.put('/update/:id', protect, authorize('student'), async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findById(req.params.id);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this study plan'
      });
    }

    // Update allowed fields
    const { weeklyGoalHours, preferences } = req.body;
    
    if (weeklyGoalHours) studyPlan.weeklyGoalHours = weeklyGoalHours;
    if (preferences) studyPlan.preferences = { ...studyPlan.preferences, ...preferences };

    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Study plan updated successfully',
      data: studyPlan
    });
  } catch (error) {
    console.error('Error updating study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study plan',
      error: error.message
    });
  }
});

// ==================== TASK MANAGEMENT ====================

// @desc    Add a new task
// @route   POST /api/study-planner/task
// @access  Private (Student)
router.post('/task', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, title, description, subject, type, priority, estimatedHours, dueDate } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Add task
    studyPlan.tasks.push({
      title,
      description,
      subject,
      type: type || 'assignment',
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 2,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 1 week
    });

    await studyPlan.save();

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: studyPlan
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task',
      error: error.message
    });
  }
});

// @desc    Update task (mark complete, update progress)
// @route   PUT /api/study-planner/task/:taskId
// @access  Private (Student)
router.put('/task/:taskId', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, status, actualHours, notes } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Find and update task
    const task = studyPlan.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (status) task.status = status;
    if (actualHours) task.actualHours = actualHours;
    if (notes) task.notes = notes;

    if (status === 'completed') {
      task.completedAt = new Date();
      
      // Initialize statistics if not exists
      if (!studyPlan.statistics) {
        studyPlan.statistics = {
          totalStudyHours: 0,
          totalTasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: new Date()
        };
      }
      
      studyPlan.statistics.totalTasksCompleted = (studyPlan.statistics.totalTasksCompleted || 0) + 1;
      studyPlan.statistics.totalStudyHours = (studyPlan.statistics.totalStudyHours || 0) + (task.actualHours || task.estimatedHours);
      
      // Update streak
      if (typeof studyPlan.updateStreak === 'function') {
        await studyPlan.updateStreak();
      }
    }

    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: studyPlan
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// @desc    Delete a task
// @route   DELETE /api/study-planner/task/:taskId
// @access  Private (Student)
router.delete('/task/:taskId', protect, authorize('student'), async (req, res) => {
  try {
    const { planId } = req.query;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Remove task
    studyPlan.tasks.pull(req.params.taskId);
    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: studyPlan
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// @desc    Get overdue tasks
// @route   GET /api/study-planner/tasks/overdue
// @access  Private (Student)
router.get('/tasks/overdue', protect, authorize('student'), async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ empid: req.user.empid }).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found'
      });
    }

    const overdueTasks = studyPlan.getOverdueTasks();

    res.status(200).json({
      success: true,
      data: overdueTasks
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue tasks',
      error: error.message
    });
  }
});

// @desc    Get upcoming tasks
// @route   GET /api/study-planner/tasks/upcoming
// @access  Private (Student)
router.get('/tasks/upcoming', protect, authorize('student'), async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const studyPlan = await StudyPlan.findOne({ empid: req.user.empid }).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found'
      });
    }

    const upcomingTasks = studyPlan.getUpcomingTasks(parseInt(days));

    res.status(200).json({
      success: true,
      data: upcomingTasks
    });
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming tasks',
      error: error.message
    });
  }
});

// ==================== GOALS MANAGEMENT ====================

// @desc    Add a new goal
// @route   POST /api/study-planner/goal
// @access  Private (Student)
router.post('/goal', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, title, description, type, targetValue, deadline, milestones } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Add goal
    studyPlan.goals.push({
      title,
      description,
      type: type || 'academic',
      targetValue: targetValue || 100,
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 1 month
      milestones: milestones || []
    });

    await studyPlan.save();

    res.status(201).json({
      success: true,
      message: 'Goal added successfully',
      data: studyPlan
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
// @route   PUT /api/study-planner/goal/:goalId
// @access  Private (Student)
router.put('/goal/:goalId', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, currentValue, status } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Find and update goal
    const goal = studyPlan.goals.id(req.params.goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (currentValue !== undefined) goal.currentValue = currentValue;
    if (status) goal.status = status;

    if (status === 'completed') {
      goal.completedAt = new Date();
    }

    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: studyPlan
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

// ==================== AI FEATURES ====================

// @desc    Generate AI-powered weekly schedule
// @route   POST /api/study-planner/generate-schedule
// @access  Private (Student)
router.post('/generate-schedule', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, preferences } = req.body;

    console.log('Generate schedule request:', { planId, preferences, empid: req.user.empid });

    // If no planId, try to find the latest study plan
    let studyPlan;
    if (planId) {
      studyPlan = await StudyPlan.findById(planId);
    } else {
      // Find the most recent study plan for this student
      studyPlan = await StudyPlan.findOne({ empid: req.user.empid }).sort({ createdAt: -1 });
    }

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found. Please create a study plan first.'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Get student's academic data
    const grades = await Grade.find({ empid: req.user.empid }).sort({ createdAt: -1 }).limit(10);

    // Get preferences from request body (from wizard) or use existing
    const userPreferences = preferences || req.body.preferences || studyPlan.preferences || {};

    // Prepare student data for AI with enhanced preferences
    const studentData = {
      empid: req.user.empid,
      name: req.user.name,
      semester: studyPlan.semester,
      weeklyGoalHours: studyPlan.weeklyGoalHours,
      weakSubjects: studyPlan.weakSubjects,
      subjects: userPreferences.subjects || [],
      tasks: studyPlan.tasks.filter(t => t.status !== 'completed'),
      upcomingExams: Array.isArray(userPreferences.upcomingExams) 
        ? userPreferences.upcomingExams 
        : (typeof userPreferences.upcomingExams === 'string' 
          ? userPreferences.upcomingExams.split(',').map(e => e.trim()).filter(e => e) 
          : []),
      assignments: studyPlan.tasks.filter(t => t.type === 'assignment' && t.status !== 'completed'),
      preferences: {
        studyHoursPerDay: userPreferences.studyHoursPerDay || 4,
        preferredStudyTime: userPreferences.preferredStudyTime || 'flexible',
        breakDuration: userPreferences.breakDuration || 15,
        studyPreferences: userPreferences.studyPreferences || ''
      },
      recentGrades: grades.map(g => ({
        subject: g.subject,
        marks: g.marks,
        totalMarks: g.totalMarks,
        percentage: ((g.marks / g.totalMarks) * 100).toFixed(1)
      }))
    };

    // Update study plan preferences
    if (req.body.preferences) {
      studyPlan.preferences = {
        ...studyPlan.preferences,
        ...userPreferences
      };
    }

    // Generate schedule using AI
    const scheduleResult = await generateWeeklySchedule(studentData);
    
    // Check if generation was successful
    if (!scheduleResult.success || !scheduleResult.schedule) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate schedule',
        error: scheduleResult.error || 'No schedule generated'
      });
    }

    // Reload study plan to avoid version conflicts
    const freshStudyPlan = await StudyPlan.findById(studyPlan._id);
    
    // Save schedule to study plan
    freshStudyPlan.weeklySchedule = scheduleResult.schedule;

    // Convert schedule slots into tasks with specific due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Create tasks from schedule (exclude breaks)
    scheduleResult.schedule.forEach((daySchedule, scheduleIndex) => {
      // Calculate the actual date for this day
      const dayName = daySchedule.day;
      const targetDayIndex = daysOfWeek.indexOf(dayName);
      
      // Calculate days until target day
      let daysUntil = targetDayIndex - currentDayIndex;
      if (daysUntil < 0) daysUntil += 7; // Next week if day has passed
      
      const taskDate = new Date(today);
      taskDate.setDate(taskDate.getDate() + daysUntil);

      // Process slots (exclude break type)
      daySchedule.slots.forEach(slot => {
        if (slot.type !== 'break' && slot.subject !== 'Break') {
          // Parse time to set specific due time
          const [hours, minutes] = slot.endTime.split(':');
          const dueDate = new Date(taskDate);
          dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Only add if it's a future date or today
          if (dueDate >= new Date()) {
            // Map AI slot type to valid task types
            const validTaskType = slot.type === 'study' ? 'practice' : 
                                 (slot.type === 'revision' ? 'revision' : 
                                 (slot.type === 'project' ? 'project' : 
                                 (slot.type === 'exam-prep' ? 'exam-prep' : 'practice')));

            freshStudyPlan.tasks.push({
              title: `${slot.subject} - ${slot.activity}`,
              description: `Scheduled study session: ${slot.activity}`,
              subject: slot.subject,
              dueDate: dueDate,
              priority: 'medium',
              type: validTaskType,
              status: 'pending',
              aiGenerated: true,
              estimatedDuration: calculateDuration(slot.startTime, slot.endTime)
            });
          }
        }
      });
    });

    await freshStudyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Weekly schedule and tasks generated successfully',
      data: {
        schedule: scheduleResult.schedule,
        tasksCreated: freshStudyPlan.tasks.filter(t => t.aiGenerated).length
      }
    });

    // Helper function to calculate duration in minutes
    function calculateDuration(startTime, endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      return (endHour * 60 + endMin) - (startHour * 60 + startMin);
    }
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
});

// @desc    Get AI recommendations
// @route   GET /api/study-planner/recommendations
// @access  Private (Student)
router.get('/recommendations', protect, authorize('student'), async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ empid: req.user.empid }).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found'
      });
    }

    // Filter active recommendations (not expired)
    const activeRecommendations = studyPlan.aiRecommendations.filter(
      rec => new Date(rec.expiresAt) > new Date()
    );

    // If no active recommendations or less than 3, generate new ones
    if (activeRecommendations.length < 3) {
      const grades = await Grade.find({ empid: req.user.empid }).sort({ createdAt: -1 }).limit(10);

      const studentProfile = {
        empid: req.user.empid,
        name: req.user.name,
        semester: studyPlan.semester,
        weakSubjects: studyPlan.weakSubjects,
        tasks: studyPlan.tasks,
        goals: studyPlan.goals,
        statistics: studyPlan.statistics,
        recentGrades: grades.map(g => ({
          subject: g.subject,
          marks: g.marks,
          totalMarks: g.totalMarks
        }))
      };

      const newRecommendations = await generateRecommendations(studentProfile);

      // Add new recommendations
      studyPlan.aiRecommendations.push(...newRecommendations);
      await studyPlan.save();

      return res.status(200).json({
        success: true,
        data: newRecommendations
      });
    }

    res.status(200).json({
      success: true,
      data: activeRecommendations
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

// @desc    Sync weak subjects from GradeMaster
// @route   POST /api/study-planner/sync-weak-subjects
// @access  Private (Student)
router.post('/sync-weak-subjects', protect, authorize('student'), async (req, res) => {
  try {
    const { planId } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.empid !== req.user.empid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Get recent grades
    const grades = await Grade.find({
      empid: req.user.empid,
      semester: studyPlan.semester
    }).sort({ createdAt: -1 });

    // Analyze weak subjects using AI
    const academicData = {
      grades: grades.map(g => ({
        subject: g.subject,
        marks: g.marks,
        totalMarks: g.totalMarks,
        percentage: (g.marks / g.totalMarks) * 100
      })),
      semester: studyPlan.semester
    };

    const weakSubjectAnalysis = await analyzePerformanceGaps(academicData);

    // Update weak subjects in study plan
    studyPlan.weakSubjects = weakSubjectAnalysis;
    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: 'Weak subjects synced successfully',
      data: weakSubjectAnalysis
    });
  } catch (error) {
    console.error('Error syncing weak subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync weak subjects',
      error: error.message
    });
  }
});

// @desc    Get subject-specific study tips
// @route   POST /api/study-planner/subject-tips
// @access  Private (Student)
router.post('/subject-tips', protect, authorize('student'), async (req, res) => {
  try {
    const { subject, topics } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    const studyTips = await generateSubjectStudyTips(subject, topics || []);

    res.status(200).json({
      success: true,
      data: studyTips
    });
  } catch (error) {
    console.error('Error generating subject tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate subject tips',
      error: error.message
    });
  }
});

// ==================== POMODORO SESSIONS ====================

// @desc    Start/track Pomodoro session
// @route   POST /api/study-planner/pomodoro
// @access  Private (Student)
router.post('/pomodoro', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, subject, duration, type } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.usn !== req.user.usn) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Get AI optimization for Pomodoro
    const context = {
      subject,
      timeOfDay: new Date().getHours(),
      recentSessions: studyPlan.pomodoroSessions.slice(-5),
      taskType: type || 'study'
    };

    const optimization = await optimizePomodoroSession(context);

    // Add Pomodoro session
    studyPlan.pomodoroSessions.push({
      subject,
      duration: duration || optimization.recommendedDuration || 25,
      completedAt: new Date(),
      type: type || 'focus'
    });

    // Update statistics
    const sessionHours = (duration || 25) / 60;
    studyPlan.statistics.totalStudyHours += sessionHours;

    // Update subject-wise hours
    const subjectIndex = studyPlan.statistics.subjectWiseHours.findIndex(
      s => s.subject === subject
    );

    if (subjectIndex > -1) {
      studyPlan.statistics.subjectWiseHours[subjectIndex].hours += sessionHours;
    } else {
      studyPlan.statistics.subjectWiseHours.push({
        subject,
        hours: sessionHours
      });
    }

    await studyPlan.save();

    res.status(201).json({
      success: true,
      message: 'Pomodoro session tracked successfully',
      data: {
        session: studyPlan.pomodoroSessions[studyPlan.pomodoroSessions.length - 1],
        optimization
      }
    });
  } catch (error) {
    console.error('Error tracking Pomodoro session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track Pomodoro session',
      error: error.message
    });
  }
});

// ==================== SHARING & COLLABORATION ====================

// @desc    Share study plan with teacher/parent
// @route   POST /api/study-planner/share
// @access  Private (Student)
router.post('/share', protect, authorize('student'), async (req, res) => {
  try {
    const { planId, shareWith, permissions } = req.body;

    const studyPlan = await StudyPlan.findById(planId);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Verify ownership
    if (studyPlan.usn !== req.user.usn) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan'
      });
    }

    // Validate shareWith user exists
    let sharedUser;
    if (shareWith.role === 'teacher') {
      sharedUser = await Teacher.findOne({ email: shareWith.email });
    } else if (shareWith.role === 'parent') {
      sharedUser = await Parent.findOne({ email: shareWith.email });
    }

    if (!sharedUser) {
      return res.status(404).json({
        success: false,
        message: `${shareWith.role} not found with email: ${shareWith.email}`
      });
    }

    // Check if already shared
    const alreadyShared = studyPlan.sharedWith.find(
      s => s.userId.toString() === sharedUser._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Study plan already shared with this user'
      });
    }

    // Add to sharedWith
    studyPlan.sharedWith.push({
      userId: sharedUser._id,
      role: shareWith.role,
      name: sharedUser.name,
      email: sharedUser.email,
      permissions: permissions || ['view']
    });

    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: `Study plan shared with ${shareWith.role} successfully`,
      data: studyPlan
    });
  } catch (error) {
    console.error('Error sharing study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share study plan',
      error: error.message
    });
  }
});

// @desc    Get shared study plans (for teachers/parents)
// @route   GET /api/study-planner/shared
// @access  Private (Teacher, Parent)
router.get('/shared', protect, authorize('teacher', 'parent'), async (req, res) => {
  try {
    const sharedPlans = await StudyPlan.find({
      'sharedWith.userId': req.user._id
    });

    res.status(200).json({
      success: true,
      data: sharedPlans
    });
  } catch (error) {
    console.error('Error fetching shared plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared plans',
      error: error.message
    });
  }
});

// ==================== STATISTICS & PROGRESS ====================

// @desc    Get study statistics
// @route   GET /api/study-planner/statistics
// @access  Private (Student, Parent, Teacher)
router.get('/statistics', protect, authorize('student', 'parent', 'teacher'), async (req, res) => {
  try {
    let usn;

    if (req.user.role === 'student') {
      usn = req.user.usn;
    } else {
      usn = req.query.usn;
      
      if (!usn) {
        return res.status(400).json({
          success: false,
          message: 'USN is required for non-student users'
        });
      }
    }

    const studyPlan = await StudyPlan.findOne({ usn }).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found'
      });
    }

    // Calculate progress
    const progress = studyPlan.calculateProgress();

    res.status(200).json({
      success: true,
      data: {
        statistics: studyPlan.statistics,
        progress,
        weeklySchedule: studyPlan.weeklySchedule,
        recentSessions: studyPlan.pomodoroSessions.slice(-10)
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// @desc    Get dashboard overview
// @route   GET /api/study-planner/dashboard
// @access  Private (Student)
router.get('/dashboard', protect, authorize('student'), async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ usn: req.user.usn }).sort({ createdAt: -1 });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'No study plan found. Please create one first.'
      });
    }

    // Get overview data
    const overdueTasks = studyPlan.getOverdueTasks();
    const upcomingTasks = studyPlan.getUpcomingTasks(3);
    const progress = studyPlan.calculateProgress();

    // Get active recommendations
    const activeRecommendations = studyPlan.aiRecommendations
      .filter(rec => new Date(rec.expiresAt) > new Date())
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        plan: studyPlan,
        overdueTasks,
        upcomingTasks,
        progress,
        recommendations: activeRecommendations,
        statistics: studyPlan.statistics
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

export default router;
