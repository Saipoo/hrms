import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Award, 
  TrendingUp, 
  Calendar,
  Download,
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalCompleted: 0,
    completionRate: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData(selectedCourse._id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/courses/teacher/my-courses',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCourses(response.data.courses || []);
      if (response.data.courses && response.data.courses.length > 0) {
        setSelectedCourse(response.data.courses[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const fetchCourseData = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch enrollments
      const enrollmentsRes = await axios.get(
        `http://localhost:5000/api/courses/${courseId}/enrollments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch certificates
      const certificatesRes = await axios.get(
        `http://localhost:5000/api/courses/${courseId}/certificates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const enrollmentsData = enrollmentsRes.data.enrollments || [];
      const certificatesData = certificatesRes.data.certificates || [];
      
      setEnrollments(enrollmentsData);
      setCertificates(certificatesData);
      
      // Calculate stats
      const totalEnrolled = enrollmentsData.length;
      const totalCompleted = enrollmentsData.filter(e => e.completed).length;
      const completionRate = totalEnrolled > 0 
        ? Math.round((totalCompleted / totalEnrolled) * 100) 
        : 0;
      const averageProgress = totalEnrolled > 0
        ? Math.round(enrollmentsData.reduce((sum, e) => sum + e.overallProgress, 0) / totalEnrolled)
        : 0;
      
      setStats({
        totalEnrolled,
        totalCompleted,
        completionRate,
        averageProgress
      });
      
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-blue-500 to-purple-600';
  };

  const getGradeColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 75) return 'bg-blue-100 text-blue-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/teacher/coursemaster')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course Creator
          </motion.button>

          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No courses created yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/teacher/coursemaster')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-lg font-semibold"
            >
              Create Your First Course
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/teacher/coursemaster')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course Creator
          </motion.button>

          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            Course Dashboard
          </h1>
          <p className="text-gray-600">Monitor your course performance and student progress</p>
        </motion.div>

        {/* Course Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <label className="block text-gray-700 font-semibold mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse?._id || ''}
            onChange={(e) => {
              const course = courses.find(c => c._id === e.target.value);
              setSelectedCourse(course);
            }}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </motion.div>

        {selectedCourse && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.totalEnrolled}
                  </span>
                </div>
                <h3 className="text-gray-600 font-semibold">Total Enrolled</h3>
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
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.totalCompleted}
                  </span>
                </div>
                <h3 className="text-gray-600 font-semibold">Completed</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.completionRate}%
                  </span>
                </div>
                <h3 className="text-gray-600 font-semibold">Completion Rate</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.averageProgress}%
                  </span>
                </div>
                <h3 className="text-gray-600 font-semibold">Avg Progress</h3>
              </motion.div>
            </div>

            {/* Enrolled Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Enrolled Students ({enrollments.length})
              </h2>

              {enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No students enrolled yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">USN</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Enrolled Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Accessed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment, index) => (
                        <motion.tr
                          key={enrollment._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium text-gray-700">
                            {enrollment.studentUSN}
                          </td>
                          <td className="py-3 px-4 text-gray-800">
                            {enrollment.studentName}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {formatDate(enrollment.enrollmentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${getProgressColor(enrollment.overallProgress)}`}
                                  style={{ width: `${enrollment.overallProgress}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-700 w-12">
                                {enrollment.overallProgress}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {enrollment.completed ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {formatDate(enrollment.lastAccessedAt)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Certificates Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Course Completions & Certificates ({certificates.length})
              </h2>

              {certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No certificates issued yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Certificate ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">USN</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Completion Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Quiz Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((certificate, index) => {
                        const scorePercentage = certificate.totalQuizMarks > 0
                          ? Math.round((certificate.quizScore / certificate.totalQuizMarks) * 100)
                          : 0;
                        
                        return (
                          <motion.tr
                            key={certificate._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 font-mono text-sm text-gray-700">
                              {certificate.certificateId}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-700">
                              {certificate.studentUSN}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {certificate.studentName}
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-sm">
                              {formatDate(certificate.completionDate)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeColor(scorePercentage)}`}>
                                {certificate.quizScore}/{certificate.totalQuizMarks} ({scorePercentage}%)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                {certificate.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <a
                                href={`http://localhost:5000/${certificate.pdfUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                <Download className="w-4 h-4" />
                                View
                              </a>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;
