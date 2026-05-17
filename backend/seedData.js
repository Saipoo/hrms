import mongoose from 'mongoose';
import Course from './models/Course.js';
import Teacher from './models/Teacher.js';
import bcrypt from 'bcrypt';

export const seedDummyCourses = async () => {
  try {
    // Delete all existing dummy courses first
    const deletedCount = await Course.deleteMany({ isDummyCourse: true });
    if (deletedCount.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deletedCount.deletedCount} old dummy courses`);
    }

    // Check if any teacher (Manager) exists
    let manager = await Teacher.findOne();
    
    if (!manager) {
      console.log('⚠️  No Manager found in database. Creating a dummy Manager...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      manager = await Teacher.create({
        name: 'John Doe',
        email: 'manager@worksphere.com',
        password: hashedPassword,
        empid: 'MGR001',
        department: 'Engineering',
        projects: ['HRMS Portal', 'AI Integration'],
        role: 'teacher'
      });
      console.log('✅ Dummy Manager created: manager@worksphere.com / password123');
    }

    const teacherId = manager._id;
    const teacherName = manager.name;

    console.log(`👨‍💼 Using Manager: ${teacherName} (${manager.email})`);

    const dummyCourses = [
      {
        title: 'Enterprise HR Management 101',
        description: 'Master the fundamentals of human resource management in a corporate environment.',
        category: 'Leadership',
        level: 'Beginner',
        estimatedDuration: 20,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Intro to HRMS', url: 'https://example.com/hrms-intro', duration: 15 }],
        quizzes: [{ question: 'What is HRMS?', options: ['Human Resource Management System', 'High Range Management', 'Human Resource Mobile Service', 'None'], correctAnswer: 0, marks: 10 }]
      },
      {
        title: 'Advanced Project Management with Agile',
        description: 'Learn to lead high-performance teams using Scrum, Kanban, and modern Agile methodologies.',
        category: 'Professional Skills',
        level: 'Advanced',
        estimatedDuration: 40,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Agile Fundamentals', url: 'https://example.com/agile', duration: 25 }],
        quizzes: [{ question: 'What is a Sprint?', options: ['A meeting', 'A time-boxed iteration', 'A fast run', 'None'], correctAnswer: 1, marks: 10 }]
      },
      {
        title: 'Corporate Communication & Leadership',
        description: 'Enhance your professional communication skills and learn to lead with emotional intelligence.',
        category: 'Leadership',
        level: 'Intermediate',
        estimatedDuration: 15,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Effective Communication', url: 'https://example.com/comm', duration: 20 }]
      },
      {
        title: 'AI Productivity for Professionals',
        description: 'Master AI tools like ChatGPT, Gemini, and Copilot to automate your daily corporate tasks.',
        category: 'AI & Automation',
        level: 'Intermediate',
        estimatedDuration: 30,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'AI in Workplace', url: 'https://example.com/ai-work', duration: 30 }]
      },
      {
        title: 'Cybersecurity for Remote Teams',
        description: 'Essential security practices for maintaining data integrity in a hybrid work environment.',
        category: 'Technical Training',
        level: 'Intermediate',
        estimatedDuration: 10,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Security Basics', url: 'https://example.com/security', duration: 15 }]
      },
      {
        title: 'Conflict Resolution & Workplace Ethics',
        description: 'Master the art of negotiation and maintaining a healthy professional environment.',
        category: 'Professional Skills',
        level: 'Intermediate',
        estimatedDuration: 12,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Mediation Techniques', url: 'https://example.com/mediation', duration: 18 }]
      },
      {
        title: 'Financial Intelligence for Team Leaders',
        description: 'Understand P&L statements, budgeting, and corporate financial health.',
        category: 'Leadership',
        level: 'Advanced',
        estimatedDuration: 25,
        teacherId,
        teacherName,
        empid: manager.empid,
        published: true,
        isDummyCourse: true,
        videos: [{ title: 'Budgeting 101', url: 'https://example.com/finance', duration: 22 }]
      }
    ];

    // Add generic quiz if missing
    dummyCourses.forEach(course => {
      if (!course.quizzes) {
        course.quizzes = [{ question: 'Is this training helpful?', options: ['Yes', 'No', 'Maybe', 'N/A'], correctAnswer: 0, marks: 5 }];
      }
    });

    const createdCourses = await Course.insertMany(dummyCourses);
    console.log(`✅ Successfully seeded ${createdCourses.length} corporate training programs!`);

  } catch (error) {
    console.error('❌ Error seeding corporate courses:', error.message);
  }
};
