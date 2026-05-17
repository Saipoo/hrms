import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  TrendingUp,
  Award,
  Calendar,
  User
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherInterviewEvaluations = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [remarkModal, setRemarkModal] = useState({ show: false, reportId: null, comment: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchQuery, filterCategory, reports]);

  const fetchReports = async () => {
    try {
      const response = await api.get('/interview/all-reports');
      if (response.data.success) {
        setReports(response.data.data);
        setFilteredReports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load interview reports');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.studentUSN.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((report) => report.category === filterCategory);
    }

    setFilteredReports(filtered);
  };

  const handleAddRemark = async () => {
    if (!remarkModal.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await api.post(`/interview/report/${remarkModal.reportId}/remark`, {
        comment: remarkModal.comment
      });

      if (response.data.success) {
        toast.success('Remarks added successfully');
        setRemarkModal({ show: false, reportId: null, comment: '' });
        fetchReports(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding remarks:', error);
      toast.error('Failed to add remarks');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Interview Evaluations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and provide feedback on student interview performances
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Total Interviews</p>
            <p className="text-3xl font-bold">{reports.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Excellent (80+)</p>
            <p className="text-3xl font-bold">
              {reports.filter((r) => r.scores.overall >= 80).length}
            </p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Good (60-79)</p>
            <p className="text-3xl font-bold">
              {reports.filter((r) => r.scores.overall >= 60 && r.scores.overall < 80).length}
            </p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Needs Improvement</p>
            <p className="text-3xl font-bold">
              {reports.filter((r) => r.scores.overall < 60).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Companies</option>
                <option value="Google">Google</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Amazon">Amazon</option>
                <option value="Infosys">Infosys</option>
                <option value="TCS">TCS</option>
                <option value="Wipro">Wipro</option>
                <option value="Cognizant">Cognizant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No interview reports found</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          {report.studentName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          USN: {report.studentUSN}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                        {report.category}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {report.domain}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {report.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(report.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-4 py-2 rounded-lg ${getScoreBg(report.scores.overall)}`}>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(report.scores.overall)}`}>
                        {report.scores.overall}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/teacher/interview-report/${report._id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() =>
                          setRemarkModal({ show: true, reportId: report._id, comment: report.teacherRemarks?.comment || '' })
                        }
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {report.teacherRemarks?.comment ? 'Edit' : 'Add'} Remark
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                    <p className={`text-xl font-bold ${getScoreColor(report.scores.confidence)}`}>
                      {report.scores.confidence}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Communication</p>
                    <p className={`text-xl font-bold ${getScoreColor(report.scores.communication)}`}>
                      {report.scores.communication}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Technical</p>
                    <p className={`text-xl font-bold ${getScoreColor(report.scores.technical)}`}>
                      {report.scores.technical}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Problem Solving</p>
                    <p className={`text-xl font-bold ${getScoreColor(report.scores.problemSolving)}`}>
                      {report.scores.problemSolving}
                    </p>
                  </div>
                </div>

                {report.teacherRemarks?.comment && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Your Remarks:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {report.teacherRemarks.comment}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Remark Modal */}
        {remarkModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Add Teacher Remarks
              </h3>
              <textarea
                value={remarkModal.comment}
                onChange={(e) => setRemarkModal({ ...remarkModal, comment: e.target.value })}
                placeholder="Enter your feedback and suggestions..."
                className="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRemarkModal({ show: false, reportId: null, comment: '' })}
                  className="flex-1 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRemark}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                >
                  Save Remarks
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherInterviewEvaluations;
