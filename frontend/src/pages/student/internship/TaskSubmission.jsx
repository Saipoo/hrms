import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Upload, FileText, Link as LinkIcon, Send, 
  Lightbulb, MessageCircle, Loader, CheckCircle, X
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../../constants/menuItems';
import { useAuth } from '../../../context/AuthContext';

const TaskSubmission = () => {
  const { user } = useAuth();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAIHelp = searchParams.get('aiHelp') === 'true';

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submission form
  const [submissionData, setSubmissionData] = useState({
    description: '',
    codeUrl: '',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // AI Help
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiConversation, setAiConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(showAIHelp ? 'ai-help' : 'submit');

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      // First get enrollments to find the task
      const enrollmentsResponse = await fetch('http://localhost:5000/api/internships/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollmentsData = await enrollmentsResponse.json();

      if (enrollmentsData.success && Array.isArray(enrollmentsData.data)) {
        // Find the enrollment that contains this task
        for (const enrollment of enrollmentsData.data) {
          const tasksResponse = await fetch(`http://localhost:5000/api/internships/enrollment/${enrollment._id}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const tasksData = await tasksResponse.json();

          if (tasksData.success && Array.isArray(tasksData.data)) {
            const foundTask = tasksData.data.find(t => t._id === taskId);
            if (foundTask) {
              setTask(foundTask);
              if (foundTask.aiConversations) {
                setAiConversation(foundTask.aiConversations);
              }
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('description', submissionData.description);
      formData.append('codeUrl', submissionData.codeUrl);
      formData.append('notes', submissionData.notes);
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:5000/api/internships/task/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Task submitted successfully! AI evaluation in progress...');
        setTimeout(() => {
          navigate(-1); // Go back to workspace
        }, 1000);
      } else {
        alert(data.message || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIHelp = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    const userMessage = { role: 'user', content: aiQuestion };
    setAiConversation(prev => [...prev, userMessage]);
    setAiQuestion('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/internships/task/ai-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId,
          question: aiQuestion
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = { role: 'assistant', content: data.response };
        setAiConversation(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = { role: 'assistant', content: 'Sorry, I couldn\'t process your request. Please try again.' };
        setAiConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error getting AI help:', error);
      const errorMessage = { role: 'assistant', content: 'An error occurred. Please try again.' };
      setAiConversation(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Task not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Task Submission"
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Workspace
        </button>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.title}</h1>
          <p className="text-gray-600">{task.description}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'submit'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Send className="w-5 h-5 inline mr-2" />
          Submit Task
        </button>
        <button
          onClick={() => setActiveTab('ai-help')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'ai-help'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Lightbulb className="w-5 h-5 inline mr-2" />
          AI Help ({task.aiHelpRequested || 0})
        </button>
      </div>

      {/* Submit Tab */}
      {activeTab === 'submit' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          {task.submission?.submittedAt ? (
            <div className="text-center py-12">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Already Submitted</h2>
              <p className="text-gray-600 mb-4">
                Submitted on {new Date(task.submission.submittedAt).toLocaleString()}
              </p>
              {task.evaluation?.overallScore && (
                <div className="bg-green-50 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {task.evaluation.overallScore}/100
                  </p>
                  <p className="text-gray-600">{task.evaluation.feedback}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Submission Description *
                </label>
                <textarea
                  value={submissionData.description}
                  onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                  required
                  rows={6}
                  placeholder="Describe your solution, approach, and what you learned..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              {/* Code URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code Repository URL (GitHub, GitLab, etc.)
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={submissionData.codeUrl}
                    onChange={(e) => setSubmissionData({ ...submissionData, codeUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Files (Screenshots, Documentation, etc.)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload files</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, PDF, ZIP (Max 10MB each)</p>
                  </label>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={submissionData.notes}
                  onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information or challenges you faced..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !submissionData.description}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit for Evaluation
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      )}

      {/* AI Help Tab */}
      {activeTab === 'ai-help' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 mb-1">AI Mentor Available</p>
                <p className="text-sm text-gray-600">
                  Ask questions about the task, get hints, or clarify requirements. 
                  The AI will guide you without giving direct solutions.
                </p>
              </div>
            </div>
          </div>

          {/* Chat History */}
          <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-xl p-4">
            {aiConversation.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No conversation yet. Ask your first question!</p>
              </div>
            ) : (
              aiConversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Loader className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAIHelp} className="flex gap-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask a question about the task..."
              className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default TaskSubmission;
