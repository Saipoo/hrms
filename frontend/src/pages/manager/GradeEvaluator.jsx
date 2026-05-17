import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiUpload, FiCheckCircle, FiClock, FiAward, FiEye, FiTrendingUp, FiBook, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const GradeEvaluator = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  // Teacher document upload state
  const [teacherDocs, setTeacherDocs] = useState({
    questionPaper: null,
    answerKey: null
  });

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/grades/teacher/submissions');
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      alert('Failed to fetch submissions');
      setSubmissions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setTeacherDocs({ ...teacherDocs, [field]: file });
  };

  const handleUploadDocs = async () => {
    if (!teacherDocs.questionPaper || !teacherDocs.answerKey) {
      alert('Please upload both question paper and answer key');
      return;
    }

    if (!selectedSubmission) {
      alert('Please select a submission first');
      return;
    }

    setUploadingDocs(true);

    const formData = new FormData();
    formData.append('submissionId', selectedSubmission._id);
    formData.append('questionPaper', teacherDocs.questionPaper);
    formData.append('answerKey', teacherDocs.answerKey);

    try {
      await api.post('/grades/upload-teacher-docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Documents uploaded successfully! You can now start AI evaluation.');
      
      // Clear form
      setTeacherDocs({ questionPaper: null, answerKey: null });
      document.getElementById('questionPaperInput').value = '';
      document.getElementById('answerKeyInput').value = '';
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedSubmission) {
      alert('Please select a submission');
      return;
    }

    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const response = await api.post(`/grades/evaluate/${selectedSubmission._id}`);
      setEvaluationResult(response.data.data);
      alert('Evaluation completed successfully!');
      
      // Refresh submissions
      await fetchSubmissions();
    } catch (error) {
      console.error('Error evaluating submission:', error);
      alert(error.response?.data?.message || 'Failed to evaluate submission');
    } finally {
      setEvaluating(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedSubmission || !evaluationResult) {
      alert('No evaluation result to verify');
      return;
    }

    if (!window.confirm('Are you sure you want to verify and publish these marks? This will make them visible to the student and parent.')) {
      return;
    }

    try {
      await api.patch(`/grades/verify/${selectedSubmission._id}`, {
        finalMarks: evaluationResult.grade.aiMarks,
        finalFeedback: evaluationResult.grade.overallFeedback
      });
      
      alert('Marks verified and published successfully!');
      
      // Clear selection and refresh
      setSelectedSubmission(null);
      setEvaluationResult(null);
      await fetchSubmissions();
    } catch (error) {
      console.error('Error verifying marks:', error);
      alert(error.response?.data?.message || 'Failed to verify marks');
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
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PageHeader 
        title="Performance Evaluator" 
        subtitle="AI-Powered Performance Review System" 
        icon={FiBook} 
      />
      <div className="max-w-7xl mx-auto p-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-h-[800px] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiFileText className="w-5 h-5" />
                Student Submissions
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !submissions || submissions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <motion.div
                      key={submission._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setEvaluationResult(null);
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition border-2 ${
                        selectedSubmission?._id === submission._id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            {submission.studentName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {submission.studentUSN}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                          {getStatusIcon(submission.status)}
                          {submission.status}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {submission.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(submission.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      {submission.status === 'Verified' && (
                        <div className="mt-2 text-sm font-bold text-green-600 dark:text-green-400">
                          ✓ {submission.aiMarks}/{submission.totalMarks}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Evaluation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedSubmission ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
              >
                <FiEye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                  Select a submission to start evaluation
                </h3>
              </motion.div>
            ) : (
              <>
                {/* Upload Documents Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiUpload className="w-5 h-5" />
                    Upload Question Paper & Answer Key
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Question Paper */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Paper
                      </label>
                      <input
                        id="questionPaperInput"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('questionPaper', e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="questionPaperInput"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition border-2 border-dashed border-blue-300 dark:border-blue-700"
                      >
                        <FiFileText className="w-5 h-5" />
                        {teacherDocs.questionPaper ? teacherDocs.questionPaper.name : 'Choose File'}
                      </label>
                    </div>

                    {/* Answer Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Answer Key
                      </label>
                      <input
                        id="answerKeyInput"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('answerKey', e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="answerKeyInput"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition border-2 border-dashed border-green-300 dark:border-green-700"
                      >
                        <FiFileText className="w-5 h-5" />
                        {teacherDocs.answerKey ? teacherDocs.answerKey.name : 'Choose File'}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadDocs}
                    disabled={uploadingDocs || !teacherDocs.questionPaper || !teacherDocs.answerKey}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploadingDocs ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiUpload className="w-5 h-5" />
                        Upload Documents
                      </>
                    )}
                  </button>
                </motion.div>

                {/* Evaluation Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <FiTrendingUp className="w-5 h-5" />
                      AI Evaluation
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSubmission.status)}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Start Evaluation Button */}
                    <button
                      onClick={handleEvaluate}
                      disabled={evaluating}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {evaluating ? (
                        <>
                          <FiLoader className="w-6 h-6 animate-spin" />
                          AI is Evaluating... This may take a minute
                        </>
                      ) : (
                        <>
                          <FiTrendingUp className="w-6 h-6" />
                          Start AI Evaluation
                        </>
                      )}
                    </button>

                    {/* Evaluation Result */}
                    <AnimatePresence>
                      {evaluationResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-4"
                        >
                          {/* Score Card */}
                          <div className="p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">AI Evaluated Score</p>
                                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                  {evaluationResult.grade.aiMarks}/{evaluationResult.grade.totalMarks}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Percentage</p>
                                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                  {evaluationResult.grade.percentage}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Question-wise Breakdown */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                              Question-wise Marks
                            </h3>
                            <div className="space-y-2">
                              {evaluationResult.grade.marksPerQuestion.map((q, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Q{q.questionNumber}
                                  </span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {q.marksObtained}/{q.maxMarks}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Overall Feedback */}
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                              AI Feedback
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {evaluationResult.grade.overallFeedback}
                            </p>
                          </div>

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {evaluationResult.strengths && evaluationResult.strengths.length > 0 && (
                              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                                  ✓ Strengths
                                </h4>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {evaluationResult.strengths.map((strength, idx) => (
                                    <li key={idx}>• {strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {evaluationResult.areasForImprovement && evaluationResult.areasForImprovement.length > 0 && (
                              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                                  ⚠ Areas for Improvement
                                </h4>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {evaluationResult.areasForImprovement.map((area, idx) => (
                                    <li key={idx}>• {area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Verify Button */}
                          <button
                            onClick={handleVerify}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-600 transition flex items-center justify-center gap-3"
                          >
                            <FiCheckCircle className="w-6 h-6" />
                            Verify & Publish Results
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeEvaluator;
