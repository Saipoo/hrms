import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle, Clock, AlertCircle, FileText, 
  Send, Lightbulb, Award, Download, TrendingUp, Target
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../../constants/menuItems';
import { useAuth } from '../../../context/AuthContext';

const InternshipWorkspace = () => {
  const { user } = useAuth();
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    fetchEnrollmentDetails();
    fetchTasks();
  }, [enrollmentId]);

  const fetchEnrollmentDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/internships/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const currentEnrollment = data.data.find(e => e._id === enrollmentId);
        setEnrollment(currentEnrollment || null);
      } else {
        setEnrollment(null);
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      setEnrollment(null);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/internships/enrollment/${enrollmentId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
        if (data.data.length > 0 && !selectedTask) {
          setSelectedTask(data.data[0]);
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/internships/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enrollmentId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('🎉 Certificate generated successfully!');
        setShowCertificateModal(true);
        navigate('/dashboard/student/internship/certificates');
      } else {
        alert(data.message || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
    }
  };

  const getTaskStatusIcon = (task) => {
    if (task.evaluation?.overallScore) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (task.submission?.submittedAt) {
      return <Clock className="w-5 h-5 text-orange-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTaskStatusText = (task) => {
    if (task.evaluation?.overallScore) {
      return 'Evaluated';
    } else if (task.submission?.submittedAt) {
      return 'Submitted';
    } else {
      return 'Assigned';
    }
  };

  const getTaskStatusColor = (task) => {
    if (task.evaluation?.overallScore) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    } else if (task.submission?.submittedAt) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    } else {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Onboarding Workspace"
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
        <button
          onClick={() => navigate('/dashboard/student/internship')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Internships
        </button>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {enrollment?.internshipId?.company} - {enrollment?.internshipId?.role}
                </h1>
                <p className="text-gray-600">{enrollment?.internshipId?.domain}</p>
              </div>
            </div>

            {enrollment?.status === 'completed' && (
              <button
                onClick={handleGenerateCertificate}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Award className="w-5 h-5" />
                Get Certificate
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(enrollment?.progress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${enrollment?.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{enrollment?.tasksCompleted || 0}</p>
              <p className="text-sm text-gray-600">Tasks Completed</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{enrollment?.overallScore?.toFixed(1) || 0}</p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{Array.isArray(tasks) ? tasks.length : 0}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Tasks
            </h2>

            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    selectedTask?._id === task._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Task {index + 1}: {task.title}
                    </h3>
                    {getTaskStatusIcon(task)}
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getTaskStatusColor(task)}`}>
                    {getTaskStatusText(task)}
                  </span>
                  {task.evaluation?.overallScore && (
                    <div className="mt-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-600">
                        Score: {task.evaluation.overallScore}/100
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Details */}
        <div className="lg:col-span-2">
          {selectedTask ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedTask.title}</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getTaskStatusColor(selectedTask)}`}>
                  {getTaskStatusText(selectedTask)}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* Requirements */}
              {selectedTask.requirements?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedTask.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deadline */}
              {selectedTask.deadline && (
                <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">
                      Deadline: {new Date(selectedTask.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Evaluation Results */}
              {selectedTask.evaluation?.overallScore && (
                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Evaluation Results
                  </h3>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedTask.evaluation.scores.accuracy}
                      </p>
                      <p className="text-xs text-gray-600">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedTask.evaluation.scores.creativity}
                      </p>
                      <p className="text-xs text-gray-600">Creativity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedTask.evaluation.scores.communication}
                      </p>
                      <p className="text-xs text-gray-600">Communication</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedTask.evaluation.overallScore}
                      </p>
                      <p className="text-xs text-gray-600">Overall</p>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="bg-white/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Feedback:</p>
                    <p className="text-gray-600 text-sm">{selectedTask.evaluation.feedback}</p>
                  </div>

                  {/* Suggestions */}
                  {selectedTask.evaluation.suggestions?.length > 0 && (
                    <div className="bg-white/50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Suggestions:</p>
                      <ul className="space-y-1">
                        {selectedTask.evaluation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-600 text-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!selectedTask.submission?.submittedAt && (
                  <button
                    onClick={() => navigate(`/dashboard/student/internship/task/${selectedTask._id}`)}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Task
                  </button>
                )}

                <button
                  onClick={() => navigate(`/dashboard/student/internship/task/${selectedTask._id}?aiHelp=true`)}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-5 h-5" />
                  Get AI Help
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Select a task to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default InternshipWorkspace;
