import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiTrendingUp, FiBook, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const GradeViewer = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentUSN, setStudentUSN] = useState('');

  useEffect(() => {
    // Get linked student USN from parent profile
    const fetchParentProfile = async () => {
      try {
        const response = await api.get('/parents/profile');
        if (response.data.linkedStudentUSN) {
          setStudentUSN(response.data.linkedStudentUSN);
          fetchResults(response.data.linkedStudentUSN);
        }
      } catch (error) {
        console.error('Error fetching parent profile:', error);
      }
    };

    fetchParentProfile();
  }, []);

  const fetchResults = async (usn) => {
    setLoading(true);
    try {
      const response = await api.get(`/grades/parent/results/${usn}`);
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const calculateAveragePercentage = () => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, result) => acc + parseFloat(result.percentage), 0);
    return (sum / results.length).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title="Performance Reviews" 
        subtitle="View and analyze performance metrics and feedback" 
        icon={FiAward} 
      />
      <div className="max-w-7xl mx-auto px-6 mt-8">

        {/* Statistics Cards */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white"
            >
              <FiBook className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-medium opacity-90">Total Subjects</h3>
              <p className="text-3xl font-bold mt-1">{results.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white"
            >
              <FiTrendingUp className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-medium opacity-90">Average Score</h3>
              <p className="text-3xl font-bold mt-1">{calculateAveragePercentage()}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white"
            >
              <FiCheckCircle className="w-8 h-8 mb-2" />
              <h3 className="text-sm font-medium opacity-90">Verified Results</h3>
              <p className="text-3xl font-bold mt-1">{results.filter(r => r.verified).length}</p>
            </motion.div>
          </div>
        )}

        {/* Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FiAward className="w-5 h-5" />
              Verified Grade Reports
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <FiAward className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No verified results yet. Results will appear here once teachers verify the grades.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Marks Obtained
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Verified Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result) => (
                    <motion.tr
                      key={result._id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className="cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiBook className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-800 dark:text-white">
                            {result.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.aiMarks}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg text-gray-600 dark:text-gray-400">
                          {result.totalMarks}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(result.percentage)}`}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          {new Date(result.verificationDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          View Details →
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Detailed Result Modal */}
        <AnimatePresence>
          {selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedResult(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {selectedResult.subject} - Detailed Report
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <FiCalendar className="w-4 h-4" />
                        Verified on {new Date(selectedResult.verificationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Overall Score */}
                  <div className="mb-6 p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Score</p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                          {selectedResult.aiMarks}/{selectedResult.totalMarks}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Percentage</p>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedResult.percentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question-wise Breakdown */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FiTrendingUp className="w-5 h-5" />
                      Question-wise Performance
                    </h3>
                    <div className="space-y-3">
                      {selectedResult.marksPerQuestion.map((q, index) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 dark:text-white">
                              Question {q.questionNumber}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {q.marksObtained}/{q.maxMarks}
                            </span>
                          </div>
                          {q.feedback && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              💡 {q.feedback}
                            </p>
                          )}
                          {q.highlights && q.highlights.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {q.highlights.map((highlight, idx) => (
                                <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                                  ✓ {highlight}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overall Feedback */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      Teacher's Feedback
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedResult.overallFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  {selectedResult.highlights && selectedResult.highlights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                        Key Strengths Identified
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.highlights.map((highlight, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                            ✓ {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GradeViewer;
