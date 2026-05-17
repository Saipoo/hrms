import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const FAQPage = ({ userRole = 'student' }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Mapping for HRMS rebranding
  const roleMapping = {
    student: 'employee',
    teacher: 'manager',
    parent: 'hr_manager',
    admin: 'admin'
  };

  const hrRole = roleMapping[userRole] || userRole;

  // Role-based colors
  const roleColors = {
    employee: 'blue',
    manager: 'green',
    hr_manager: 'purple',
    admin: 'red'
  };
  const color = roleColors[hrRole] || 'blue';

  // Simple hardcoded FAQs for each role
  const DUMMY_FAQS = {
    employee: [
      {
        id: 1,
        category: 'Account and Login',
        question: 'How do I reset my password?',
        answer: 'To reset your password:\n1. Click on "Forgot Password" on the login page\n2. Enter your registered work email address\n3. Check your email for the password reset link\n4. Click the link and create a new password\n5. Login with your new password'
      },
      {
        id: 2,
        category: 'Account and Login',
        question: 'How do I update my profile photo?',
        answer: 'To update your profile photo:\n1. Go to your dashboard\n2. Click on your profile icon in the top right or go to "Profile Settings"\n3. Click "Upload Photo"\n4. Select a professional image (max 2MB)\n5. Click "Save Changes". Your new photo will appear in the dashboard header.'
      },
      {
        id: 3,
        category: 'Attendance and Work',
        question: 'How do I mark my attendance?',
        answer: 'WorkSphere uses biometric AI verification:\n1. Go to "Mark Attendance" from your dashboard\n2. Select your shift (Morning, Afternoon, or Remote)\n3. If at office, allow location access to verify you are within the radius\n4. Perform a quick Face Scan for biometric verification\n5. Click "Mark Attendance" once verified'
      },
      {
        id: 4,
        category: 'Attendance and Work',
        question: 'Can I mark attendance from home?',
        answer: 'Yes, if you are working remotely:\n1. Select "Remote Work" in the session selection\n2. Confirm your remote status\n3. Your attendance will be flagged for Manager review\n4. Ensure you follow company policy for remote work logging'
      },
      {
        id: 5,
        category: 'Attendance and Work',
        question: 'What is the allowed radius for office attendance?',
        answer: 'The office radius is set by HR (typically 100-200 meters). If you are outside this range, the system will prevent biometric verification and suggest switching to Remote mode or contacting your HR Manager.'
      },
      {
        id: 6,
        category: 'Performance and Appraisals',
        question: 'Where can I see my performance metrics?',
        answer: 'WorkSphere HRMS uses AI-powered metrics:\n1. Check your "Employee Dashboard" for real-time attendance rates\n2. View "Workload Analysis" to see project engagement\n3. Access detailed performance history through the "Reports" section\n4. AI-generated insights help you identify areas for professional growth'
      },
      {
        id: 7,
        category: 'Performance and Appraisals',
        question: 'How is my attendance rate calculated?',
        answer: 'Your attendance rate is the percentage of working days you were marked "Present" (either via Face Scan or approved Remote work) over the total working days in the period.'
      },
      {
        id: 8,
        category: 'Career Growth',
        question: 'What is the Interview Simulator?',
        answer: 'The Interview Simulator helps you prepare for internal promotions or project leads:\n1. Select the role type (Technical, Management, or Leadership)\n2. AI conducts a realistic interview with you\n3. Receive instant feedback on your tone, content, and confidence\n4. Improve your communication skills for professional advancement'
      },
      {
        id: 9,
        category: 'Career Growth',
        question: 'How does the Career Advisor work?',
        answer: 'The AI Career Advisor analyzes your work history and interests:\n1. It recommends skill certifications based on your current role\n2. Identifies emerging industry trends (via Real-Time Updates)\n3. Suggests internal mobility paths within the company\n4. Helps you plan your long-term career roadmap'
      },
      {
        id: 10,
        category: 'Technical Support',
        question: 'What is the Anonymous Feedback (Confessions) feature?',
        answer: 'To ensure a healthy workplace, you can submit anonymous feedback:\n1. Go to the "Confessions" portal\n2. Submit your thoughts, concerns, or appreciation without revealing your identity\n3. HR Managers review these to improve workplace culture\n4. Identity is cryptographically protected and never shared'
      },
      {
        id: 11,
        category: 'Technical Support',
        question: 'How do I use the HR AI Chatbot?',
        answer: 'The HR Chatbot is your 24/7 internal assistant:\n1. Click the chat icon in the bottom right corner\n2. Ask about company policies, leave balance, or platform navigation\n3. Get instant AI-powered responses based on the employee handbook\n4. For complex issues, it will escalate your query to the HR department'
      }
    ],
    manager: [
      {
        id: 1,
        category: 'Team Management',
        question: 'How do I monitor my team\'s attendance?',
        answer: 'As a Manager, your dashboard provides real-time oversight:\n1. View the "Team Overview" card for today\'s attendance status\n2. Use filters to see who is Working Remotely vs. In-Office\n3. Review "Remote Attendance" flags that require your approval\n4. Access historical logs for performance reviews'
      },
      {
        id: 2,
        category: 'Team Management',
        question: 'How do I approve Remote Work attendance?',
        answer: 'Remote logs appear in your "Pending Reviews" section. You can click "Approve" or "Reject" based on pre-coordinated work plans. All decisions are logged for HR transparency.'
      },
      {
        id: 3,
        category: 'Project Oversight',
        question: 'Can I assign work modules to employees?',
        answer: 'Yes! Using the "Work Assignment" tool:\n1. Create new project modules\n2. Assign them to specific team members or departments\n3. Track progress through AI-generated engagement scores\n4. Provide feedback directly through the MentorConnect portal'
      },
      {
        id: 4,
        category: 'Mentorship',
        question: 'What is MentorConnect for Managers?',
        answer: 'It\'s a dedicated portal for professional development:\n1. Schedule 1-on-1 performance coaching sessions\n2. Send departmental announcements\n3. Review employee growth roadmaps\n4. Share resources for skill upscaling'
      },
      {
        id: 5,
        category: 'Performance Reviews',
        question: 'How does AI help with appraisals?',
        answer: 'WorkSphere AI aggregates attendance, project engagement, and peer feedback to provide a "Performance Dashboard". This objective data assists you in conducting fair and data-driven quarterly appraisals.'
      }
    ],
    hr_manager: [
      {
        id: 1,
        category: 'Workforce Overview',
        question: 'How do I set the Office Geofence?',
        answer: 'HR Managers can configure the office location:\n1. Go to "System Settings" in your HR Dashboard\n2. Search for your office address or use "My Current Location"\n3. Set the allowed radius (e.g., 100m)\n4. Save to apply the geofence globally for all employees'
      },
      {
        id: 2,
        category: 'Workforce Overview',
        question: 'How do I export attendance reports for payroll?',
        answer: 'To export data:\n1. Go to "Attendance Logs"\n2. Apply date filters (e.g., current month)\n3. Click "Export CSV" or "Export PDF"\n4. The report includes Employee ID, Total Present Days, Remote Days, and Absences'
      },
      {
        id: 3,
        category: 'Employee Wellness',
        question: 'How do I moderate Anonymous Feedback?',
        answer: 'The "Confessions Portal" allows you to view aggregate sentiment:\n1. Review anonymous submissions to gauge office morale\n2. Flag urgent concerns for executive review\n3. Respond to "Global" feedback items with departmental announcements\n4. Use AI sentiment analysis to track workplace satisfaction trends'
      },
      {
        id: 4,
        category: 'System Security',
        question: 'What should I do if an employee cannot register their face?',
        answer: 'If biometric registration fails:\n1. Ensure the employee is using a high-quality camera\n2. Check for sufficient lighting\n3. If issues persist, you can "Reset Biometric Profile" in the Employee Management section, allowing them to try registration again.'
      }
    ]
  };

  // Get FAQs for current role
  const allFAQs = DUMMY_FAQS[hrRole] || [];

  // Extract unique categories
  const categories = ['all', ...new Set(allFAQs.map(faq => faq.category))];

  // Filter FAQs
  const filteredFAQs = allFAQs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title="Frequently Asked Questions" 
        subtitle="Find answers to common questions about WorkSphere HRMS platform features and policies"
        icon={HelpCircle}
      />

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search FAQs... (e.g., 'How do I reset my password?')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by Category:</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? `bg-${color}-600 text-white shadow-md`
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQs List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-xl shadow-sm"
            >
              <HelpCircle size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">
                {searchQuery
                  ? `No FAQs found for "${searchQuery}"`
                  : 'No FAQs available in this category'}
              </p>
            </motion.div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center font-semibold`}>
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {faq.question}
                        </h3>
                        <span className={`text-sm text-${color}-600 font-medium`}>
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className={`text-${color}-600 flex-shrink-0`} size={24} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={24} />
                  )}
                </button>

                <AnimatePresence>
                  {expandedFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-6 pb-6 pt-2 border-t border-gray-100`}>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
      </div>
    </div>
  );
};

export default FAQPage;
