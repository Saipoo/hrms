import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * WorkSphere HRMS AI Chatbot Service
 * Provides context-aware responses about WorkSphere HRMS features
 */
class ChatbotService {
  
  /**
   * Get WorkSphere feature context based on user role
   */
  static getFeatureContext(role) {
    const baseFeatures = {
      common: `
WorkSphere HRMS Platform Features:
- **Dashboard**: Overview of all activities and quick workforce stats
- **Company Updates & News**: AI-curated news about HR, business, jobs, and motivation
- **Profile Management**: Update personal information and settings
- **PoornaGPT**: External AI tools platform (https://poornagpt.vercel.app)
`,
      student: `
Employee-Specific Features:
- **My Attendance Records**: View your attendance records, check-ins, check-outs, and statistics
- **Mark Attendance**: Geolocation-based clock-in/clock-out system
- **Performance Reviews**: Check your performance scores, ratings, and analytics
- **Training Programs**: Browse and enroll in company training programs
- **Work Planner**: AI-powered work schedule and task management
- **HR Growth Advisor**: Get personalized career growth and HR guidance
- **Company Documents & Policies**: Access company policy documents and training materials
- **Interview Prep Simulator**: Practice HR interviews with AI feedback
- **Employee Onboarding Simulator**: Onboarding scenarios and learning paths
- **Manager Connect**: Connect with your manager and schedule 1-on-1 meetings
- **Innovation Challenges**: Participate in company hackathons and innovation programs
`,
      teacher: `
Manager-Specific Features:
- **Performance Evaluator**: Upload KPIs, evaluate team performance, view analytics
- **Training Program Creator**: Create and manage employee training programs
- **Employee Attendance Logs**: View and manage team attendance records
- **Shift Schedule Management**: Manage shift rosters and work schedules
- **Company Documents**: Upload and manage company policy documents
- **Training Reports**: View employee training completion and progress
- **Innovation Reports**: Monitor innovation challenge participation
- **Meeting Scheduler**: Schedule 1-on-1 and team meetings
`,
      parent: `
HR Manager-Specific Features:
- **HR Dashboard**: Monitor overall workforce performance
- **Employee Attendance Tracking**: View attendance records and patterns
- **Performance Reports**: Access detailed performance reviews and analytics
- **Workforce Insights**: AI-generated insights about workforce progress
- **Meeting Requests**: Schedule meetings with managers or administrators
`
    };

    return baseFeatures.common + (baseFeatures[role] || '');
  }

  /**
   * Get navigation routes for features — mapped to actual App.jsx routes
   */
  static getNavigationMap() {
    return {
      // Employee (student) routes
      'dashboard': '/dashboard/employee',
      'employee dashboard': '/dashboard/employee',
      'attendance': '/dashboard/employee/attendance-history',
      'my attendance': '/dashboard/employee/attendance-history',
      'mark attendance': '/dashboard/employee/mark-attendance',
      'check in': '/dashboard/employee/mark-attendance',
      'check-in': '/dashboard/employee/mark-attendance',
      'performance reviews': '/dashboard/employee/grade-master',
      'performance review': '/dashboard/employee/grade-master',
      'training programs': '/dashboard/employee/course-master',
      'training program': '/dashboard/employee/course-master',
      'work planner': '/dashboard/employee/planner',
      'hr growth advisor': '/dashboard/employee/career-advisor',
      'career advisor': '/dashboard/employee/career-advisor',
      'company documents': '/dashboard/employee/documents',
      'policies': '/dashboard/employee/documents',
      'interview prep': '/dashboard/employee/interview',
      'interview simulator': '/dashboard/employee/interview',
      'onboarding simulator': '/dashboard/employee/onboarding',
      'onboarding': '/dashboard/employee/onboarding',
      'manager connect': '/mentor-connect',
      'mentorconnect': '/mentor-connect',
      'company updates': '/dashboard/employee/updates',
      'real-time updates': '/dashboard/employee/updates',
      'innovation challenges': '/dashboard/employee/challenges',
      'challenges': '/dashboard/employee/challenges',
      'faq': '/dashboard/employee/faq',
      'faqs': '/dashboard/employee/faq',
      'help': '/dashboard/employee/faq',
      'about': '/dashboard/employee/about',
      'about us': '/dashboard/employee/about',
      'about worksphere': '/dashboard/employee/about',
      // Manager (teacher) routes
      'manager dashboard': '/dashboard/manager',
      'attendance logs': '/dashboard/manager/attendance-logs',
      'employee attendance': '/dashboard/manager/attendance-logs',
      'shift schedule': '/dashboard/manager/timetable',
      'timetable': '/dashboard/manager/timetable',
      'performance evaluator': '/dashboard/manager/grade-evaluator',
      'training creator': '/dashboard/manager/course-creator',
      'training dashboard': '/dashboard/manager/course-dashboard',
      'training reports': '/dashboard/manager/internship-reports',
      'innovation reports': '/dashboard/manager/hackathon-reports',
      'manager faq': '/dashboard/manager/faq',
      'manager about': '/dashboard/manager/about',
      // HR (parent) routes
      'hr dashboard': '/dashboard/hr',
      'hr faq': '/dashboard/hr/faq',
      'hr about': '/dashboard/hr/about',
      'performance viewer': '/dashboard/hr/grades'
    };
  }

  /**
   * Extract navigation intent from query
   */
  static extractNavigationIntent(query) {
    const lowerQuery = query.toLowerCase();
    const navigationMap = this.getNavigationMap();
    
    for (const [feature, route] of Object.entries(navigationMap)) {
      if (lowerQuery.includes(feature) || 
          lowerQuery.includes(`go to ${feature}`) ||
          lowerQuery.includes(`open ${feature}`) ||
          lowerQuery.includes(`show ${feature}`)) {
        return { feature, route };
      }
    }
    
    return null;
  }

  /**
   * Generate menu options based on role — all routes verified against App.jsx
   */
  static getMenuOptions(role) {
    const menus = {
      student: [
        { icon: '🏠', label: 'Employee Dashboard', route: '/dashboard/employee' },
        { icon: '📍', label: 'Mark Attendance (Check-In/Out)', route: '/dashboard/employee/mark-attendance' },
        { icon: '📊', label: 'My Attendance Records', route: '/dashboard/employee/attendance-history' },
        { icon: '⭐', label: 'Performance Reviews', route: '/dashboard/employee/grade-master' },
        { icon: '📚', label: 'Training Programs', route: '/dashboard/employee/course-master' },
        { icon: '📝', label: 'Work Planner', route: '/dashboard/employee/planner' },
        { icon: '🎯', label: 'HR Growth Advisor', route: '/dashboard/employee/career-advisor' },
        { icon: '📄', label: 'Company Documents & Policies', route: '/dashboard/employee/documents' },
        { icon: '💼', label: 'Interview Prep Simulator', route: '/dashboard/employee/interview' },
        { icon: '🚀', label: 'Employee Onboarding Simulator', route: '/dashboard/employee/onboarding' },
        { icon: '👔', label: 'Manager Support', route: '/mentor-connect' },
        { icon: '📰', label: 'Company Updates & News', route: '/dashboard/employee/updates' },
        { icon: '🏆', label: 'Innovation Challenges', route: '/dashboard/employee/challenges' },
        { icon: '❓', label: 'FAQs & Help', route: '/dashboard/employee/faq' },
        { icon: 'ℹ️', label: 'About WorkSphere HRMS', route: '/dashboard/employee/about' },
        { icon: '🪄', label: 'Explore PoornaGPT', route: 'https://poornagpt.vercel.app', external: true }
      ],
      teacher: [
        { icon: '🏠', label: 'Manager Dashboard', route: '/dashboard/manager' },
        { icon: '📊', label: 'Employee Attendance Logs', route: '/dashboard/manager/attendance-logs' },
        { icon: '📅', label: 'Shift Schedule Management', route: '/dashboard/manager/timetable' },
        { icon: '⭐', label: 'Performance Evaluator', route: '/dashboard/manager/grade-evaluator' },
        { icon: '📚', label: 'Training Program Creator', route: '/dashboard/manager/course-creator' },
        { icon: '📈', label: 'Training Dashboard', route: '/dashboard/manager/course-dashboard' },
        { icon: '💼', label: 'Interview Evaluations', route: '/dashboard/manager/interview-evaluations' },
        { icon: '🚀', label: 'Training Reports', route: '/dashboard/manager/internship-reports' },
        { icon: '🏆', label: 'Innovation Reports', route: '/dashboard/manager/hackathon-reports' },
        { icon: '🎥', label: 'Company Documents', route: '/dashboard/manager/lectures' },
        { icon: '👔', label: 'Mentor Connect', route: '/mentor-connect' },
        { icon: '❓', label: 'FAQs & Help', route: '/dashboard/manager/faq' },
        { icon: 'ℹ️', label: 'About WorkSphere HRMS', route: '/dashboard/manager/about' },
        { icon: '🪄', label: 'Explore PoornaGPT', route: 'https://poornagpt.vercel.app', external: true }
      ],
      parent: [
        { icon: '🏠', label: 'HR Dashboard', route: '/dashboard/hr' },
        { icon: '📊', label: 'Employee Performance', route: '/dashboard/hr/grades' },
        { icon: '❓', label: 'FAQs & Help', route: '/dashboard/hr/faq' },
        { icon: 'ℹ️', label: 'About WorkSphere HRMS', route: '/dashboard/hr/about' },
        { icon: '🪄', label: 'Explore PoornaGPT', route: 'https://poornagpt.vercel.app', external: true }
      ]
    };

    return menus[role] || menus.student;
  }

  /**
   * Generate AI response using Gemini
   */
  static async generateResponse(query, role, context = {}) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Check for navigation intent first
      const navIntent = this.extractNavigationIntent(query);
      
      // Check for menu request
      if (query.toLowerCase().includes('menu') || query.toLowerCase().includes('options')) {
        return {
          response: `Here are the available features in WorkSphere HRMS:\n\n${this.getMenuOptions(role).map(m => `${m.icon} **${m.label}**`).join('\n')}\n\nJust tell me which one you'd like to explore, or ask me anything!`,
          actionType: 'menu',
          menuOptions: this.getMenuOptions(role)
        };
      }

      // Check for PoornaGPT request
      if (query.toLowerCase().includes('poornagpt') || query.toLowerCase().includes('ai tools')) {
        return {
          response: `🪄 **PoornaGPT** is an all-in-one AI tools platform that offers:\n\n✨ Multiple AI assistants for different tasks\n🎨 Creative tools and generators\n📝 Writing and content assistance\n🧠 Problem-solving utilities\n\nIt's a separate platform designed to complement WorkSphere HRMS with additional AI capabilities. Would you like to explore it?`,
          actionType: 'poornagpt',
          externalLink: 'https://poornagpt.vercel.app'
        };
      }

      // Check for FAQ/Help request
      if (query.toLowerCase().includes('faq') || 
          query.toLowerCase().includes('frequently asked') ||
          query.toLowerCase().includes('help') ||
          query.toLowerCase().includes('how do i') ||
          query.toLowerCase().includes('how can i') ||
          query.toLowerCase().includes('how to')) {
        const roleMap = { student: 'student', teacher: 'teacher', parent: 'parent' };
        const faqRoute = `/dashboard/${roleMap[role] || 'student'}/faq`;
        return {
          response: `❓ I can help you with that! Our **FAQ section** has comprehensive answers to common questions about:\n\n• Account and login issues\n• Using platform features\n• Attendance and performance\n• Technical support\n• And much more!\n\nWould you like to browse the FAQs or ask me a specific question here?`,
          actionType: 'navigation',
          navigationTarget: faqRoute,
          featureName: 'FAQs & Help'
        };
      }

      // Check for About/Team/Contact request
      if (query.toLowerCase().includes('about') ||
          query.toLowerCase().includes('team') ||
          query.toLowerCase().includes('who made') ||
          query.toLowerCase().includes('who created') ||
          query.toLowerCase().includes('contact') ||
          query.toLowerCase().includes('feedback') ||
          query.toLowerCase().includes('suggestion')) {
        const roleMap = { student: 'student', teacher: 'teacher', parent: 'parent' };
        const aboutRoute = `/dashboard/${roleMap[role] || 'student'}/about`;
        return {
          response: `ℹ️ **About WorkSphere HRMS**\n\nWorkSphere HRMS is built by the **IDEA_CRAP** team:\n• A POORNA SESHASEYAN - Senior Software Developer\n• Rakshith Subramanya Ravi - Team Lead\n• Chinmaya S Shetty - Senior Data and Product Analyst\n• Ajay S Patil - Senior Software Tester\n\nOur platform integrates AI-based workforce management, communication, assessment, and analytics to revolutionize HR operations.\n\nWant to learn more about our team, technologies, or provide feedback?`,
          actionType: 'navigation',
          navigationTarget: aboutRoute,
          featureName: 'About WorkSphere'
        };
      }

      // Build context-aware prompt
      const featureContext = this.getFeatureContext(role);
      const roleDisplayMap = { student: 'Employee', teacher: 'Manager', parent: 'HR Manager', admin: 'System Administrator' };
      const prompt = `You are the WorkSphere HRMS AI Assistant, a friendly and helpful chatbot for the WorkSphere HR Management System.

User Role: ${roleDisplayMap[role] || role.charAt(0).toUpperCase() + role.slice(1)}
User Query: "${query}"

Platform Context:
${featureContext}

Instructions:
1. Provide a helpful, conversational response (2-4 sentences max)
2. Use emojis to make it friendly
3. If the query is about a specific feature, explain it briefly and suggest opening it
4. If navigation is implied, mention you can take them there
5. Keep responses concise and actionable
6. Use markdown formatting for clarity
7. Always refer to users as "Employee", "Manager", or "HR Manager" based on their role — never "Student", "Teacher", or "Parent"

Response:`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      return {
        response: aiResponse,
        actionType: navIntent ? 'navigation' : 'information',
        navigationTarget: navIntent?.route || null,
        featureName: navIntent?.feature || null
      };

    } catch (error) {
      console.error('Chatbot AI Error:', error);
      
      // Fallback response if Gemini fails
      return {
        response: `I'm here to help! 🤖 You can ask me about:\n\n📊 **Features**: What does Performance Reviews do?\n🧭 **Navigation**: Take me to Work Planner\n📋 **Menu**: Show me all options\n\nWhat would you like to know?`,
        actionType: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Generate greeting message based on role and time
   */
  static getGreeting(role, userName = null) {
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const name = userName ? `, ${userName}` : '';
    
    const roleMessages = {
      student: `${timeGreeting}${name}! 👋 I'm your WorkSphere HR Assistant.\n\nI can help you with:\n• 📍 Marking attendance & checking records\n• ⭐ Viewing performance reviews\n• 📚 Finding training programs\n• 🎯 Career growth guidance\n• 💼 Interview & onboarding prep\n• And much more!\n\nWhat would you like to explore today?`,
      teacher: `${timeGreeting}${name}! 👋 I'm your WorkSphere HR Assistant.\n\nI can help you with:\n• ⭐ Managing performance & training\n• 📊 Tracking employee attendance\n• 📚 Creating training programs\n• 📅 Managing shift schedules\n• And much more!\n\nHow can I assist you today?`,
      parent: `${timeGreeting}${name}! 👋 I'm your WorkSphere HR Assistant.\n\nI can help you:\n• 📈 Monitor workforce performance\n• 📊 View attendance & reviews\n• 💬 Understand platform features\n• And much more!\n\nWhat would you like to know?`
    };

    return roleMessages[role] || roleMessages.student;
  }
}

export default ChatbotService;
