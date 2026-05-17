import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Shield, Clock, CheckCircle, AlertCircle,
  Eye, EyeOff, Calendar, Flag, ChevronRight, Loader, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import ConfessionModal from '../components/ConfessionModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const MyConfessionsPage = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfession, setSelectedConfession] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMyConfessions();
  }, []);

  const fetchMyConfessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/confessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConfessions(response.data.data.confessions || []);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast.error('Failed to load your confessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Acknowledged':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'In Discussion':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Resolved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Escalated':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />;
      case 'Acknowledged':
      case 'In Discussion':
        return <AlertCircle size={16} />;
      case 'Resolved':
        return <CheckCircle size={16} />;
      case 'Escalated':
        return <Flag size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'High':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredConfessions = confessions.filter(confession => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['Pending', 'Acknowledged', 'In Discussion'].includes(confession.status);
    if (filter === 'resolved') return confession.status === 'Resolved';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading your confessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <PageHeader 
        title="My Feedback" 
        subtitle="Track the status of your submitted feedback" 
        icon={MessageSquare} 
      />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex gap-3">
            <button
              onClick={fetchMyConfessions}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow font-semibold transition-colors"
            >
              <MessageSquare size={18} />
              <span>Submit Anonymous Feedback</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({confessions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'pending'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Active ({confessions.filter(c => ['Pending', 'Acknowledged', 'In Discussion'].includes(c.status)).length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'resolved'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Resolved ({confessions.filter(c => c.status === 'Resolved').length})
            </button>
          </div>
        </div>

        {/* Confessions List */}
        {filteredConfessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-lg"
          >
            <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Feedback Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't submitted any feedback. Your space is always safe when you need it.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all font-semibold flex items-center gap-2 mx-auto"
            >
              <MessageSquare size={20} />
              Submit Your First Feedback
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredConfessions.map((confession, idx) => (
              <motion.div
                key={confession._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedConfession(confession)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">
                        {confession.confessionId}
                      </span>
                      {confession.visibility === 'Anonymous' ? (
                        <Shield size={14} className="text-purple-600" />
                      ) : (
                        <Eye size={14} className="text-blue-600" />
                      )}
                      {confession.isFlagged && (
                        <Flag size={14} className="text-red-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {confession.category}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(confession.status)}`}>
                    {getStatusIcon(confession.status)}
                    {confession.status}
                  </span>
                </div>

                {/* Content Preview */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {confession.content}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(confession.submittedAt).toLocaleDateString()}
                    </span>
                    <span className={`font-semibold ${getSeverityColor(confession.severity)}`}>
                      {confession.severity} Priority
                    </span>
                  </div>
                  {confession.responses && confession.responses.length > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      {confession.responses.length} Response{confession.responses.length !== 1 ? 's' : ''}
                      <ChevronRight size={14} />
                    </span>
                  )}
                </div>

                {/* Share Status */}
                {confession.shareWithParent && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-purple-600">
                    <Shield size={12} />
                    Shared with parent
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedConfession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedConfession(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      {selectedConfession.confessionId}
                    </span>
                    {selectedConfession.visibility === 'Anonymous' ? (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                        <Shield size={12} />
                        Anonymous
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                        <Eye size={12} />
                        Identified
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedConfession.category}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedConfession(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border inline-flex items-center gap-2 ${getStatusColor(selectedConfession.status)}`}>
                  {getStatusIcon(selectedConfession.status)}
                  {selectedConfession.status}
                </span>
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Your Concern:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedConfession.content}
                </p>
              </div>

              {/* AI Analysis (if available) */}
              {selectedConfession.aiSummary && (
                <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">AI Analysis:</h3>
                  <p className="text-sm text-purple-800">
                    {selectedConfession.aiSummary}
                  </p>
                </div>
              )}

              {/* Responses */}
              {selectedConfession.responses && selectedConfession.responses.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Responses from Staff:
                  </h3>
                  <div className="space-y-3">
                    {selectedConfession.responses
                      .filter(r => !r.isPrivate) // Only show non-private responses to student
                      .map((response, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-900">
                              {response.from}
                            </span>
                            <span className="text-xs text-blue-600">
                              {new Date(response.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{response.message}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Timeline:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />
                    <span>Submitted: {new Date(selectedConfession.submittedAt).toLocaleString()}</span>
                  </div>
                  {selectedConfession.acknowledgedAt && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle size={14} />
                      <span>Acknowledged: {new Date(selectedConfession.acknowledgedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedConfession.resolvedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={14} />
                      <span>Resolved: {new Date(selectedConfession.resolvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfessionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          fetchMyConfessions();
        }}
      />
    </div>
  );
};

export default MyConfessionsPage;
