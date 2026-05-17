import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';

const InterviewResults = () => {
  const { user } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/interview/report/${reportId}`);
      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load interview report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // TODO: Implement PDF generation
    toast.success('PDF download feature coming soon!');
  };

  const retryInterview = () => {
    navigate('/dashboard/student/interview');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const ScoreCard = ({ label, score, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 ${getScoreColor(score)}`} />
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        {label}
      </h3>
      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyzing your interview...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Report Not Found
          </h2>
          <button
            onClick={() => navigate('/dashboard/student/interview')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Interview Simulator
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Role Transition Prep"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard/student/interview')}
            className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Interview Simulator
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Interview Report
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {report.category} - {report.domain} ({report.role})
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Completed on {new Date(report.completedAt).toLocaleDateString()} at{' '}
                {new Date(report.completedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadPDF}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={retryInterview}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Interview
              </button>
            </div>
          </div>
        </div>

        {/* Overall Score Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-8 mb-8 border-2 ${getScoreBgColor(report.scores.overall)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Overall Performance
              </h2>
              <p className={`text-6xl font-bold ${getScoreColor(report.scores.overall)}`}>
                {report.scores.overall}/100
              </p>
              <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-2xl">
                {report.aiFeedback.summary}
              </p>
            </div>
            <Award className={`w-32 h-32 ${getScoreColor(report.scores.overall)} opacity-20`} />
          </div>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ScoreCard
            label="Confidence"
            score={report.scores.confidence}
            icon={TrendingUp}
          />
          <ScoreCard
            label="Communication"
            score={report.scores.communication}
            icon={MessageSquare}
          />
          <ScoreCard
            label="Technical Skills"
            score={report.scores.technical}
            icon={Sparkles}
          />
          <ScoreCard
            label="Problem Solving"
            score={report.scores.problemSolving}
            icon={CheckCircle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                What Went Well ✅
              </h3>
            </div>
            <ul className="space-y-3">
              {report.analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Areas to Improve 🔍
              </h3>
            </div>
            <ul className="space-y-3">
              {report.analysis.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Detailed Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Detailed AI Feedback
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {report.aiFeedback.detailedFeedback}
          </p>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Recommendations
            </h3>
          </div>
          <ul className="space-y-3">
            {report.aiFeedback.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Suggested Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-accent-600" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Suggested Courses to Improve
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.aiFeedback.suggestedCourses.map((course, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => navigate('/dashboard/student/course-master')}
              >
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {course.reason}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Teacher Remarks (if any) */}
        {report.teacherRemarks?.comment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">
              👩‍🏫 Teacher's Remarks
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {report.teacherRemarks.comment}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Added on {new Date(report.teacherRemarks.remarksAt).toLocaleDateString()}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewResults;
