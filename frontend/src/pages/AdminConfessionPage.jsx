import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, MessageSquare, TrendingUp, AlertCircle, CheckCircle,
  Clock, Users, BarChart3, Flag, Loader, ChevronDown, User,
  Calendar, Brain, Filter, Download, Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminConfessionPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [confessions, setConfessions] = useState([]);
  const [selectedConfession, setSelectedConfession] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    category: 'all',
    flagged: false
  });
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Acknowledged: 'bg-blue-100 text-blue-700',
    'In Discussion': 'bg-purple-100 text-purple-700',
    Resolved: 'bg-green-100 text-green-700',
    Escalated: 'bg-red-100 text-red-700'
  };

  const severityColors = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    fetchConfessions();
    fetchAnalytics();
    fetchDepartments();
  }, [filters]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.flagged) params.append('flagged', 'true');

      const response = await axios.get(
        `${API_URL}/api/confessions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfessions(response.data.data.confessions);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast.error('Failed to load confessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/confessions/analytics/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/confessions/meta/departments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDepartments(response.data.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAssignDepartment = async (confessionId, department) => {
    if (!department) {
      toast.error('Please select a department');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/confessions/${confessionId}/assign-department`,
        { department },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchConfessions();
      setSelectedDepartment('');
    } catch (error) {
      console.error('Error assigning to department:', error);
      toast.error(error.response?.data?.message || 'Failed to assign to department');
    }
  };

  const handleAssignTeacher = async (confessionId, teacherId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/confessions/${confessionId}/assign`,
        { teacherId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Teacher assigned successfully');
      fetchConfessions();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast.error('Failed to assign teacher');
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
      if (selectedConfession?._id === confessionId) {
        setSelectedConfession({ ...selectedConfession, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddAdminNote = async (confessionId) => {
    if (!adminNote.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/confessions/${confessionId}/responses`,
        { message: adminNote, isPrivate: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Admin note added');
      setAdminNote('');
      fetchConfessions();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-purple-600" size={24} />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {analytics.totalConfessions}
            </p>
            <p className="text-sm text-gray-600 mt-1">Confessions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-600" size={24} />
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {analytics.statusBreakdown?.Pending || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Need Attention</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Flag className="text-red-600" size={24} />
              <span className="text-sm text-gray-500">Flagged</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {analytics.flaggedCount || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Urgent Cases</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-sm text-gray-500">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {analytics.statusBreakdown?.Resolved || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Cases Closed</p>
          </motion.div>
        </div>
      )}

      {/* Category Distribution */}
      {analytics?.categoryBreakdown && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" />
            Category Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
              const percentage = (count / analytics.totalConfessions) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Severity Breakdown */}
      {analytics?.severityBreakdown && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-600" />
            Severity Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.severityBreakdown).map(([severity, count]) => (
              <div key={severity} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className={`text-2xl font-bold ${severityColors[severity].replace('bg-', 'text-').replace('100', '600')}`}>
                  {count}
                </p>
                <p className="text-sm text-gray-600 mt-1">{severity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConfessionList = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filters and List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Filter size={18} />
            Filters
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
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
              <label className="text-xs text-gray-600 mb-1 block">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Academic Issue">Academic Issue</option>
                <option value="Faculty Concern">Faculty Concern</option>
                <option value="Peer Conflict">Peer Conflict</option>
                <option value="Personal/Emotional">Personal/Emotional</option>
                <option value="College Infrastructure">College Infrastructure</option>
                <option value="Harassment/Disciplinary">Harassment/Disciplinary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.flagged}
                onChange={(e) => setFilters({ ...filters, flagged: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Flagged Only</span>
            </label>
          </div>
        </div>

        {/* Confession List */}
        <div className="bg-white rounded-xl shadow-sm max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto text-purple-600" size={32} />
            </div>
          ) : confessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No confessions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {confessions.map((confession) => (
                <motion.div
                  key={confession._id}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  onClick={() => setSelectedConfession(confession)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedConfession?._id === confession._id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">
                        {confession.confessionId}
                      </span>
                      {confession.flagged && <Flag size={14} className="text-red-500" />}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${severityColors[confession.severity]}`}>
                      {confession.severity}
                    </span>
                  </div>
                  
                  <p className="font-medium text-gray-800 text-sm mb-1">
                    {confession.studentId?.name || 'Anonymous Student'}
                  </p>
                  
                  <p className="text-xs text-gray-600 mb-2">{confession.category}</p>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[confession.status]}`}>
                    {confession.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confession Details */}
      <div className="lg:col-span-2">
        {selectedConfession ? (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedConfession.studentId?.name || 'Anonymous Student'}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">
                    {selectedConfession.confessionId}
                  </span>
                  {selectedConfession.visibility === 'Anonymous' && (
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                      🔒 Anonymous
                    </span>
                  )}
                  {selectedConfession.flagged && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      🚩 Flagged
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedConfession.status]}`}>
                  {selectedConfession.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors[selectedConfession.severity]}`}>
                  {selectedConfession.severity}
                </span>
              </div>
            </div>

            {/* AI Analysis */}
            {selectedConfession.aiSummary && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Brain size={18} />
                  AI Analysis
                </h3>
                <p className="text-sm text-purple-800 mb-2">{selectedConfession.aiSummary}</p>
                {selectedConfession.aiRecommendation && (
                  <p className="text-xs text-purple-700">
                    <strong>Recommendation:</strong> {selectedConfession.aiRecommendation}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Confession</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedConfession.content}</p>
            </div>

            {/* Admin Actions */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Admin Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedConfession._id, 'Acknowledged')}
                    disabled={selectedConfession.status === 'Acknowledged'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Mark Acknowledged
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedConfession._id, 'In Discussion')}
                    disabled={selectedConfession.status === 'In Discussion'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    In Discussion
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedConfession._id, 'Resolved')}
                    disabled={selectedConfession.status === 'Resolved'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedConfession._id, 'Escalated')}
                    disabled={selectedConfession.status === 'Escalated'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Escalate
                  </button>
                </div>
              </div>

              {/* Assign to Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Assign to Department
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name} ({dept.teacherCount} manager{dept.teacherCount !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      handleAssignDepartment(selectedConfession._id, selectedDepartment);
                    }}
                    disabled={!selectedDepartment}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Assigns confession to all managers in the selected department
                </p>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Add Private Admin Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal notes (not visible to student)"
                  className="w-full px-4 py-2 border rounded-lg text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={() => handleAddAdminNote(selectedConfession._id)}
                  className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Responses */}
            {selectedConfession.responses && selectedConfession.responses.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Response History</h3>
                <div className="space-y-2">
                  {selectedConfession.responses.map((response, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-900">{response.from}</span>
                        <span className="text-xs text-blue-600">
                          {new Date(response.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{response.message}</p>
                      {response.isPrivate && (
                        <span className="text-xs text-red-600 mt-1 block">🔒 Private (Admin Only)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Select a confession to view details</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title="Confession Management Console" 
        subtitle="Administrative oversight and analytics for employee concerns" 
        icon={Shield} 
      />
      <div className="max-w-7xl mx-auto px-6 mt-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              Overview & Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('confessions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'confessions'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              All Confessions
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? renderOverview() : renderConfessionList()}
      </div>
    </div>
  );
};

export default AdminConfessionPage;
