import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiAward, FiTrendingUp, FiBook } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const GradeMaster = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  
  // Upload form state
  const [formData, setFormData] = useState({
    subject: '',
    answerScript: null
  });

  const categories = [
    'Leadership',
    'Operational Efficiency',
    'Innovation & Problem Solving',
    'Team Collaboration',
    'Corporate Compliance',
    'Technical Excellence',
    'Strategic Thinking',
    'Customer Success',
    'Process Improvement'
  ];

  // Fetch submissions and results
  useEffect(() => {
    fetchSubmissions();
    fetchResults();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/grades/student/submissions');
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await api.get('/grades/student/results');
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, answerScript: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.answerScript) {
      alert('Please select a subject and upload your answer script');
      return;
    }

    setLoading(true);
    
    const data = new FormData();
    data.append('subject', formData.subject);
    data.append('answerScript', formData.answerScript);

    try {
      await api.post('/grades/upload-answer', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadSuccess(true);
      setFormData({ subject: '', answerScript: null });
      
      // Reset form
      document.getElementById('answerScriptInput').value = '';
      
      // Refresh submissions
      await fetchSubmissions();
      
      // Hide success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading answer script:', error);
      alert(error.response?.data?.message || 'Failed to upload answer script');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Graded': return 'text-blue-600 bg-blue-100';
      case 'Verified': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock className="w-4 h-4" />;
      case 'Graded': return <FiCheckCircle className="w-4 h-4" />;
      case 'Verified': return <FiAward className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="KPIs & Performance"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiUpload className="w-5 h-5" />
                Submit Performance Evidence
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    KPI Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evidence Document (PDF/DOCX)
                  </label>
                  <div className="relative">
                    <input
                      id="answerScriptInput"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label
                      htmlFor="answerScriptInput"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg cursor-pointer hover:from-blue-600 hover:to-purple-600 transition"
                    >
                      <FiFileText className="w-5 h-5" />
                      {formData.answerScript ? formData.answerScript.name : 'Choose File'}
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-5 h-5" />
                      Submit for Grading
                    </>
                  )}
                </button>
              </form>

              {/* Success Message */}
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300"
                  >
                    <FiCheckCircle className="w-5 h-5" />
                    Answer script uploaded successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Submissions & Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Submissions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiFileText className="w-5 h-5" />
                My Submissions
              </h2>

              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No submissions yet. Upload your first answer script above!
                  </p>
                ) : (
                  submissions.map((submission) => (
                    <motion.div
                      key={submission._id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            {submission.subject}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Submitted: {new Date(submission.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                            {getStatusIcon(submission.status)}
                            {submission.status}
                          </span>
                        </div>
                      </div>
                      
                      {submission.status === 'Verified' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Marks:</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {submission.aiMarks}/{submission.totalMarks}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Verified Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiAward className="w-5 h-5" />
                Verified Results
              </h2>

              <div className="space-y-3">
                {results.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No verified results yet. Results will appear here once teacher verifies your submissions.
                  </p>
                ) : (
                  results.map((result) => (
                    <motion.div
                      key={result._id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700 cursor-pointer"
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            {result.subject}
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Verified: {new Date(result.verificationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {result.aiMarks}/{result.totalMarks}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {result.percentage}%
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-green-200 dark:border-green-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {result.overallFeedback}
                        </p>
                        <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          View Detailed Report →
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Verified on {new Date(selectedResult.verificationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                      Question-wise Analysis
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
                              {q.feedback}
                            </p>
                          )}
                          {q.highlights && q.highlights.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {q.highlights.map((highlight, idx) => (
                                <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                                  {highlight}
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
                      Overall Feedback
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
                        Key Points Identified
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
    </DashboardLayout>
  );
};

export default GradeMaster;
