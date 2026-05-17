import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, TrendingUp, MessageSquare, Calendar, Shield,
  AlertCircle, CheckCircle, Loader, Brain, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ParentWellbeingPage = () => {
  const [loading, setLoading] = useState(true);
  const [emotionalHealth, setEmotionalHealth] = useState(null);
  const [sharedConfessions, setSharedConfessions] = useState([]);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    fetchWellbeingData();
  }, []);

  const fetchWellbeingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get confessions shared with parent
      const confessionsResponse = await axios.get(
        `${API_URL}/api/confessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const confessions = confessionsResponse.data.data.confessions;
      setSharedConfessions(confessions);

      // Get emotional health summary if we have confessions
      if (confessions.length > 0 && confessions[0].studentId) {
        const studentId = confessions[0].studentId._id || confessions[0].studentId;
        setStudentId(studentId);
        
        const healthResponse = await axios.get(
          `${API_URL}/api/confessions/parent/emotional-health/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setEmotionalHealth(healthResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching wellbeing data:', error);
      toast.error('Failed to load wellbeing data');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'text-green-600 bg-green-100';
      case 'Needs Attention':
        return 'text-orange-600 bg-orange-100';
      case 'Neutral':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Employee Well-being Dashboard" 
        subtitle="Monitor your team's well-being and feedback" 
        icon={Heart} 
      />
      <div className="max-w-6xl mx-auto p-6">
        {/* Emotional Health Summary */}
        {emotionalHealth ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-purple-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-full">
                  <Brain className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Emotional Health Summary
                  </h2>
                  <p className="text-sm text-gray-600">
                    AI-powered insights based on recent concerns
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${getSentimentColor(emotionalHealth.sentiment)}`}>
                {emotionalHealth.sentiment}
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                {emotionalHealth.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-purple-600" size={20} />
                  <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {emotionalHealth.confessionCount} concern{emotionalHealth.confessionCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600">in the last 30 days</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-600" size={20} />
                  <h3 className="font-semibold text-gray-800">Recommendations</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {emotionalHealth.recommendations?.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl p-8 mb-6 text-center mt-4">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Recent Feedback
            </h2>
            <p className="text-gray-600">
              Your team hasn't shared any feedback recently. This is a positive sign!
            </p>
          </div>
        )}

        {/* Important Information */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Privacy & Transparency</h3>
              <p className="text-sm text-blue-800">
                You can only see feedback that employees have explicitly chosen to share with you. 
                This respects their privacy while keeping you informed about important matters.
              </p>
            </div>
          </div>
        </div>

        {/* Shared Confessions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={24} className="text-purple-600" />
            Shared Feedback ({sharedConfessions.length})
          </h2>

          {sharedConfessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Shield size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500 mb-2">
                No feedback shared with you yet
              </p>
              <p className="text-gray-400">
                Employees can choose to share their feedback with you when submitting them.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sharedConfessions.map((confession, idx) => (
                <motion.div
                  key={confession._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {confession.confessionId}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          confession.status === 'Resolved'
                            ? 'bg-green-100 text-green-700'
                            : confession.status === 'In Discussion'
                            ? 'bg-purple-100 text-purple-700'
                            : confession.status === 'Acknowledged'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {confession.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {confession.category}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      confession.severity === 'Critical'
                        ? 'bg-red-100 text-red-700'
                        : confession.severity === 'High'
                        ? 'bg-orange-100 text-orange-700'
                        : confession.severity === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {confession.severity}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {confession.content}
                    </p>
                  </div>

                  {confession.aiSummary && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                      <p className="text-sm text-purple-900">
                        <span className="font-semibold">AI Analysis:</span> {confession.aiSummary}
                      </p>
                    </div>
                  )}

                  {confession.responses && confession.responses.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <MessageSquare size={16} />
                        HR Responses ({confession.responses.length})
                      </h4>
                      <div className="space-y-2">
                        {confession.responses.map((response, respIdx) => (
                          <div key={respIdx} className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-blue-900">
                                {response.from}
                              </span>
                              <span className="text-xs text-blue-600">
                                {new Date(response.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Submitted {new Date(confession.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {confession.sentiment && (
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        <span>{confession.sentiment}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Heart className="text-purple-600" size={20} />
            How You Can Help
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Maintain open communication:</strong> Create a safe space for your team to share their feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Regular check-ins:</strong> Ask about their work and listen actively without judgment</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Work with the HR:</strong> The concerns shown here are being addressed by our HR staff</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Professional support:</strong> Don't hesitate to seek HR support if concerns persist</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentWellbeingPage;
