import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InternshipReports = () => {
  const [loading, setLoading] = useState(true);
  const [searchUSN, setSearchUSN] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'student'

  useEffect(() => {
    fetchAllEnrollments();
  }, []);

  const fetchAllEnrollments = async () => {
    try {
      setLoading(true);
      // This would require a new endpoint to get all enrollments
      // For now, we'll show a search interface
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const searchStudent = async () => {
    if (!searchUSN.trim()) {
      toast.error('Please enter a USN');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/internships/student/${searchUSN.toUpperCase()}`);
      
      if (response.data.success) {
        setStudentData(response.data.data);
        setViewMode('student');
        toast.success('Student data loaded');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error(error.response?.data?.message || 'Failed to load student data');
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'enrolled':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'submitted':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading && viewMode === 'all') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard/teacher"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Code className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Internship Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor student internship progress and performance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchUSN}
                onChange={(e) => setSearchUSN(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
                placeholder="Enter Student USN..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchStudent}
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </motion.div>

        {/* Student Data Display */}
        {studentData && viewMode === 'student' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Code className="w-12 h-12 opacity-80" />
                  <TrendingUp className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.enrollments.length}
                </h3>
                <p className="opacity-90">Total Internships</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-12 h-12 opacity-80" />
                  <TrendingUp className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.enrollments.filter(e => e.status === 'completed').length}
                </h3>
                <p className="opacity-90">Completed</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card bg-gradient-to-br from-purple-500 to-pink-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Download className="w-12 h-12 opacity-80" />
                  <TrendingUp className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.certificates.length}
                </h3>
                <p className="opacity-90">Certificates Earned</p>
              </motion.div>
            </div>

            {/* Enrollments List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Code className="w-6 h-6 text-blue-600" />
                Internship Enrollments
              </h2>
              <div className="space-y-4">
                {studentData.enrollments.length > 0 ? (
                  studentData.enrollments.map((enrollment) => (
                    <div
                      key={enrollment._id}
                      className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            {enrollment.role}
                          </h3>
                          <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-1">
                            {enrollment.company}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                              {enrollment.domain}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(enrollment.status)}`}>
                              {enrollment.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary-600">
                            {enrollment.completedTasks || 0}/{enrollment.totalTasks}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Progress</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {Math.round(((enrollment.completedTasks || 0) / enrollment.totalTasks) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${((enrollment.completedTasks || 0) / enrollment.totalTasks) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Enrolled:</span>{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </div>
                        {enrollment.completedAt && (
                          <div>
                            <span className="font-medium">Completed:</span>{' '}
                            {new Date(enrollment.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No internship enrollments found</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Certificates */}
            {studentData.certificates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Download className="w-6 h-6 text-purple-600" />
                  Certificates Earned
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentData.certificates.map((cert) => (
                    <div
                      key={cert._id}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-purple-900 dark:text-purple-300">
                            {cert.role}
                          </h3>
                          <p className="text-purple-700 dark:text-purple-400">{cert.company}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {cert.finalScore}%
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* No Results */}
        {!studentData && viewMode === 'student' && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a student USN and click search to view their internship data
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InternshipReports;
