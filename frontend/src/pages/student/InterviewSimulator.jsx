import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Code,
  Clock,
  TrendingUp,
  Play,
  Award,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const InterviewSimulator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recentInterviews, setRecentInterviews] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchRecentInterviews();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/interview/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load interview categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentInterviews = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const response = await api.get(`/interview/results/${user.usn || user.empid || user.id || user._id || 'EMPLOYEE'}`);
        if (response.data.success) {
          // Show all interviews (not just 3)
          setRecentInterviews(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching recent interviews:', error);
    }
  };

  const handleStartInterview = (category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleProceedToInterview = async () => {
    if (!selectedDomain || !role) {
      toast.error('Please select domain and enter role');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/interview/start', {
        category: selectedCategory.name,
        domain: selectedDomain,
        role,
        difficulty
      });

      if (response.data.success) {
        toast.success('Interview session started!');
        navigate(`/dashboard/employee/interview/session/${response.data.sessionId}`, {
          state: {
            sessionId: response.data.sessionId,
            questions: response.data.questions,
            duration: response.data.duration
          }
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const CategoryCard = ({ category }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
      onClick={() => handleStartInterview(category)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{category.logo}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          category.difficulty === 'Hard' 
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        }`}>
          {category.difficulty}
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        {category.name}
      </h3>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <Clock className="w-4 h-4" />
        <span>{category.duration} minutes</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {category.domains.slice(0, 3).map((domain, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs"
          >
            {domain}
          </span>
        ))}
        {category.domains.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
            +{category.domains.length - 3} more
          </span>
        )}
      </div>

      <button className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-primary-700 hover:to-accent-700 transition-colors">
        <Play className="w-4 h-4" />
        Start Interview
      </button>
    </motion.div>
  );

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Role Transition Prep"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">

          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Interviews</p>
                  <p className="text-2xl font-bold">{recentInterviews.length}</p>
                </div>
                <Award className="w-10 h-10 opacity-80" />
              </div>
            </div>

            {recentInterviews.length > 0 && (
              <>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Average Score</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          recentInterviews.reduce((sum, r) => sum + r.scores.overall, 0) / 
                          recentInterviews.length
                        )}%
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Latest Score</p>
                      <p className="text-2xl font-bold">
                        {recentInterviews[0]?.scores.overall}%
                      </p>
                    </div>
                    <Sparkles className="w-10 h-10 opacity-80" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Interviews */}
        {recentInterviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Your Interview History ({recentInterviews.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentInterviews.map((interview) => (
                <motion.div
                  key={interview._id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/employee/interview/results/${interview._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {interview.category}
                    </h3>
                    <span className="text-lg font-bold text-primary-600">
                      {interview.scores.overall}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {interview.domain} - {interview.role}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{new Date(interview.completedAt).toLocaleDateString()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Categories */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Choose a Company
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>

        {/* Pre-Interview Modal */}
        <AnimatePresence>
          {showModal && selectedCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{selectedCategory.logo}</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {selectedCategory.name} Interview
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Duration: {selectedCategory.duration} minutes
                  </p>
                </div>

                {/* Domain Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Domain *
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a domain</option>
                    {selectedCategory.domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Role/Position *
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., Software Engineer, Frontend Developer"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Difficulty Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                          difficulty === level
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    📋 Interview Rules
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    <li>• Keep your camera and microphone on</li>
                    <li>• Do not refresh or leave the window</li>
                    <li>• Speak clearly and maintain eye contact</li>
                    <li>• Answer all questions to the best of your ability</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToInterview}
                    disabled={!selectedDomain || !role || loading}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        I'm Ready — Start
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default InterviewSimulator;
