import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';


const AttendanceLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogs: 0,
    presentCount: 0,
    absentCount: 0,
    faceRecognitionCount: 0,
    manualCount: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    subject: '',
    startDate: '',
    endDate: '',
    status: '',
    mode: '',
    searchQuery: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/logs');
      if (response.data.success) {
        const logsData = response.data.data;
        setLogs(logsData);
        calculateStats(logsData);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logsData) => {
    setStats({
      totalLogs: logsData.length,
      presentCount: logsData.filter(log => log.status === 'Present').length,
      absentCount: logsData.filter(log => log.status === 'Absent').length,
      faceRecognitionCount: logsData.filter(log => log.mode === 'Face Recognition').length,
      manualCount: logsData.filter(log => log.mode === 'Manual').length
    });
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Subject filter
    if (filters.subject) {
      filtered = filtered.filter(log => log.subject === filters.subject);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.date) <= new Date(filters.endDate));
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    // Mode filter
    if (filters.mode) {
      filtered = filtered.filter(log => log.mode === filters.mode);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.usn.toLowerCase().includes(query) ||
        log.name.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
    calculateStats(filtered);
  };

  const resetFilters = () => {
    setFilters({
      subject: '',
      startDate: '',
      endDate: '',
      status: '',
      mode: '',
      searchQuery: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['USN', 'Name', 'Subject', 'Date', 'Time', 'Status', 'Mode'];
    const rows = filteredLogs.map(log => [
      log.usn,
      log.name,
      log.subject,
      new Date(log.date).toLocaleDateString(),
      log.time,
      log.status,
      log.mode
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_logs_${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Logs exported to CSV');
  };

  const exportToPDF = () => {
    // In a real implementation, use a library like jsPDF
    toast.info('PDF export functionality coming soon');
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-xl p-6 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-lg bg-white dark:bg-gray-800`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </motion.div>
  );



  const attendancePercentage = stats.totalLogs > 0
    ? ((stats.presentCount / stats.totalLogs) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title="Employee Attendance Logs" 
        subtitle="View and manage employee attendance records" 
        icon={FileText} 
      />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end mb-8 mt-4">
          <div className="flex gap-3">
            <button
              onClick={fetchLogs}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button onClick={exportToPDF} className="btn btn-secondary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export PDF
            </button>
            <button onClick={exportToCSV} className="btn btn-primary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Total Logs"
            value={stats.totalLogs}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={Users}
            label="Present Students"
            value={stats.presentCount}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-900/20"
            trend={5}
          />
          <StatCard
            icon={TrendingUp}
            label="Attendance Rate"
            value={`${attendancePercentage}%`}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatCard
            icon={Calendar}
            label="Face Recognition"
            value={stats.faceRecognitionCount}
            color="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {user?.subjects?.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mode</label>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="input-field"
              >
                <option value="">All Modes</option>
                <option value="Face Recognition">Face Recognition</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Search USN/Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  placeholder="Search..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={resetFilters} className="btn btn-secondary">
              Reset Filters
            </button>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Attendance Records
            <span className="ml-auto text-sm font-normal text-gray-500">
              Showing {filteredLogs.length} of {logs.length} records
            </span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    USN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">
                        {log.usn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.status === 'Present'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.mode === 'Face Recognition'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {log.mode}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No attendance logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendanceLogs;
