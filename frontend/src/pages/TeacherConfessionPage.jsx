import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Send, Flag, CheckCircle, Clock, AlertCircle,
  Filter, Search, X, Loader, Shield, User, Calendar, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TeacherConfessionPage = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfession, setSelectedConfession] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    category: 'all'
  });

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Acknowledged': 'bg-blue-100 text-blue-800',
    'In Discussion': 'bg-purple-100 text-purple-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Escalated': 'bg-red-100 text-red-800'
  };

  const severityColors = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchConfessions();
  }, [filters]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/api/confessions?`;
      if (filters.status !== 'all') url += `status=${filters.status}&`;
      if (filters.severity !== 'all') url += `severity=${filters.severity}&`;
      if (filters.category !== 'all') url += `category=${filters.category}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConfessions(response.data.data.confessions);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast.error('Failed to load confessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (confessionId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/confessions/${confessionId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Status updated successfully');
      fetchConfessions();
      if (selectedConfession?.confessionId === confessionId) {
        setSelectedConfession({ ...selectedConfession, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConfession) return;

    try {
      setSendingReply(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/confessions/${selectedConfession.confessionId}/responses`,
        { message: replyText, isPrivate: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Reply sent successfully');
      setReplyText('');
      fetchConfessions();
      
      // Refresh selected confession
      const response = await axios.get(
        `${API_URL}/api/confessions/${selectedConfession.confessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedConfession(response.data.data);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFlagConfession = async (confessionId, reason) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/confessions/${confessionId}/flag`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Confession flagged for admin review');
      fetchConfessions();
    } catch (error) {
      console.error('Error flagging confession:', error);
      toast.error('Failed to flag confession');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title="Employee Concerns" 
        subtitle="Review and respond to employee concerns assigned to you" 
        icon={MessageSquare} 
      />
      <div className="max-w-7xl mx-auto px-6 mt-8">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="In Discussion">In Discussion</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="Academic Issue">Academic Issue</option>
                <option value="Faculty Concern">Faculty Concern</option>
                <option value="Peer Conflict">Peer Conflict</option>
                <option value="Personal/Emotional Concern">Personal/Emotional</option>
                <option value="College Infrastructure">Infrastructure</option>
                <option value="Harassment/Disciplinary Issue">Harassment/Disciplinary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Confessions List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Confessions ({confessions.length})
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin text-green-600" size={32} />
              </div>
            ) : confessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No confessions assigned to you yet</p>
              </div>
            ) : (
              confessions.map((confession) => (
                <motion.div
                  key={confession._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedConfession(confession)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all ${
                    selectedConfession?._id === confession._id
                      ? 'ring-2 ring-green-500 shadow-md'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gray-500">
                      {confession.confessionId}
                    </span>
                    {confession.isFlagged && (
                      <Flag size={16} className="text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {confession.visibility === 'Anonymous' ? (
                      <Shield size={16} className="text-blue-500" />
                    ) : (
                      <User size={16} className="text-green-500" />
                    )}
                    <span className="font-medium text-gray-800">
                      {confession.studentName}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {confession.category}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[confession.status]}`}>
                      {confession.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${severityColors[confession.severity]}`}>
                      {confession.severity}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(confession.submittedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Confession Details */}
          <div className="lg:col-span-2">
            {selectedConfession ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        {selectedConfession.studentName}
                      </h2>
                      {selectedConfession.visibility === 'Anonymous' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Shield size={12} />
                          Anonymous
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedConfession.confessionId} • {selectedConfession.category}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedConfession(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[selectedConfession.status]}`}>
                    {selectedConfession.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${severityColors[selectedConfession.severity]}`}>
                    {selectedConfession.severity} Priority
                  </span>
                  {selectedConfession.sentiment && (
                    <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                      {selectedConfession.sentiment}
                    </span>
                  )}
                </div>

                {/* AI Summary */}
                {selectedConfession.aiSummary && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <TrendingUp size={16} />
                      AI Analysis
                    </h3>
                    <p className="text-sm text-purple-800 mb-2">{selectedConfession.aiSummary}</p>
                    <p className="text-sm text-purple-700 italic">{selectedConfession.aiRecommendation}</p>
                  </div>
                )}

                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Student's Concern:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedConfession.content}</p>
                </div>

                {/* Responses */}
                {selectedConfession.responses && selectedConfession.responses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Responses:</h3>
                    <div className="space-y-3">
                      {selectedConfession.responses.map((response, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-900">
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

                {/* Actions */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Actions:</h3>
                  
                  {/* Status Update */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['Acknowledged', 'In Discussion', 'Resolved'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedConfession.confessionId, status)}
                          disabled={selectedConfession.status === status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedConfession.status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        onClick={() => handleFlagConfession(selectedConfession.confessionId, 'Requires admin attention')}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
                      >
                        <Flag size={16} />
                        Flag for Admin
                      </button>
                    </div>
                  </div>

                  {/* Reply */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send Reply to Student
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response here..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sendingReply}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingReply ? (
                          <Loader className="animate-spin" size={20} />
                        ) : (
                          <>
                            <Send size={20} />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">
                  Select a confession to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherConfessionPage;
