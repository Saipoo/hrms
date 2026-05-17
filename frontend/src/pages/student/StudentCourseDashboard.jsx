import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  BarChart3,
  Target,
  Play
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';


const StudentCourseDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    inProgress: 0,
    averageProgress: 0,
    totalCertificates: 0,
    totalLearningHours: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user._id || user.id || null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserId();

      if (!userId) {
        alert('Please login to view dashboard');
        navigate('/login');
        return;
      }

      // Fetch enrollments
      const enrollmentsRes = await axios.get(
        `http://localhost:5000/api/courses/progress/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const enrollmentsData = enrollmentsRes.data.enrollments || [];
      setEnrollments(enrollmentsData);

      // Calculate stats
      const totalEnrolled = enrollmentsData.length;
      const completed = enrollmentsData.filter(e => e.completed).length;
      const inProgress = totalEnrolled - completed;
      const averageProgress = totalEnrolled > 0
        ? Math.round(enrollmentsData.reduce((sum, e) => sum + e.overallProgress, 0) / totalEnrolled)
        : 0;
      const totalCertificates = enrollmentsData.filter(e => e.certificateGenerated).length;
      
      // Calculate total learning hours (estimated)
      const totalLearningHours = enrollmentsData.reduce((sum, e) => {
        if (e.courseId && e.courseId.estimatedDuration) {
          return sum + (e.courseId.estimatedDuration * (e.overallProgress / 100));
        }
        return sum;
      }, 0);

      setStats({
        totalEnrolled,
        completed,
        inProgress,
        averageProgress,
        totalCertificates,
        totalLearningHours: Math.round(totalLearningHours)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-blue-500 to-purple-600';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Learning Progress"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {stats.totalEnrolled}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold">Courses Enrolled</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.inProgress} in progress
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {stats.completed}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold">Completed</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalEnrolled > 0 
                ? Math.round((stats.completed / stats.totalEnrolled) * 100) 
                : 0}% completion rate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {stats.totalCertificates}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold">Certificates Earned</h3>
            <p className="text-sm text-gray-500 mt-1">
              Keep learning to earn more!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {stats.totalLearningHours}h
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold">Learning Hours</h3>
            <p className="text-sm text-gray-500 mt-1">
              Avg progress: {stats.averageProgress}%
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/student/course-master')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <BookOpen className="w-5 h-5" />
            Browse All Courses
          </motion.button>
        </motion.div>

        {/* My Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" />
            My Learning Progress
          </h2>

          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">You haven't enrolled in any courses yet</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/student/course-master')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-lg font-semibold"
              >
                Start Learning Now
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => navigate('/dashboard/student/course-master')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {enrollment.courseId?.title || enrollment.courseName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enrolled on {formatDate(enrollment.enrollmentDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {enrollment.completed ? (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-700">
                          {enrollment.overallProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${enrollment.overallProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${getProgressColor(enrollment.overallProgress)}`}
                        />
                      </div>
                    </div>

                    {enrollment.certificateGenerated && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Award className="w-5 h-5" />
                        <span className="text-sm font-semibold">Certificate Earned</span>
                      </div>
                    )}
                  </div>

                  {enrollment.lastAccessedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last accessed: {formatDate(enrollment.lastAccessedAt)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Achievements Section */}
        {stats.completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center gap-4">
              <Award className="w-12 h-12" />
              <div>
                <h2 className="text-2xl font-bold mb-1">Congratulations! 🎉</h2>
                <p className="text-yellow-100">
                  You've completed {stats.completed} {stats.completed === 1 ? 'course' : 'courses'} and earned {stats.totalCertificates} {stats.totalCertificates === 1 ? 'certificate' : 'certificates'}!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default StudentCourseDashboard;
