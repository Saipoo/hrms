import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  UserCheck,
  Activity,
  TrendingUp,
  Calendar,
  Shield,
  RefreshCw,
  Download,
  MapPin,
  Navigation,
  Save,
  Building2,
  LogOut
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    totalHRManagers: 0,
    totalAttendanceLogs: 0,
    faceRecognitionCount: 0,
    manualCount: 0,
    overallAttendanceRate: 0
  });
  // Office location state
  const [officeLocation, setOfficeLocation] = useState(null);
  const [officeRadius, setOfficeRadius] = useState(100);
  const [officeName, setOfficeName] = useState('Company Office');
  const [savingLocation, setSavingLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  const [systemActivities, setSystemActivities] = useState([]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all necessary data
      const [logsResponse, statsResponse] = await Promise.all([
        api.get('/attendance/logs?limit=10'),
        api.get('/attendance/stats')
      ]);

      if (logsResponse.data.success) {
        const logs = logsResponse.data.data;
        setRecentLogs(logs);

        // Calculate stats from logs
        const faceRecognition = logs.filter(log => log.mode === 'Face Recognition').length;
        const manual = logs.filter(log => log.mode === 'Manual').length;
        const present = logs.filter(log => log.status === 'Present').length;
        const attendanceRate = logs.length > 0 ? ((present / logs.length) * 100).toFixed(1) : 0;

        setStats({
          totalEmployees: Math.floor(Math.random() * 500) + 200, // Mock data
          totalManagers: Math.floor(Math.random() * 50) + 20, // Mock data
          totalHRManagers: Math.floor(Math.random() * 400) + 150, // Mock data
          totalAttendanceLogs: logs.length,
          faceRecognitionCount: faceRecognition,
          manualCount: manual,
          overallAttendanceRate: parseFloat(attendanceRate)
        });

        // Generate system activities from logs
        const activities = logs.slice(0, 5).map(log => ({
          action: `${log.name} marked ${log.status.toLowerCase()} for ${log.subject}`,
          time: new Date(log.date).toLocaleString(),
          type: log.mode
        }));
        setSystemActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch office location on mount
  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const res = await api.get('/attendance/office-location');
      if (res.data.success && res.data.data) {
        setOfficeLocation(res.data.data);
        setOfficeRadius(res.data.data.radius || 100);
        setOfficeName(res.data.data.locationName || 'Company Office');
        setManualLat(String(res.data.data.latitude || ''));
        setManualLng(String(res.data.data.longitude || ''));
      }
    } catch (err) {
      console.warn('Could not fetch office location:', err);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setManualLat(String(position.coords.latitude));
        setManualLng(String(position.coords.longitude));
        setGettingLocation(false);
        toast.success(`Location captured: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setGettingLocation(false);
        toast.error('Could not get location: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveOfficeLocation = async () => {
    if (!manualLat || !manualLng) {
      toast.error('Please enter or capture latitude and longitude first');
      return;
    }
    setSavingLocation(true);
    try {
      const res = await api.post('/attendance/office-location', {
        latitude: parseFloat(manualLat),
        longitude: parseFloat(manualLng),
        radius: officeRadius,
        locationName: officeName
      });
      if (res.data.success) {
        setOfficeLocation(res.data.data);
        toast.success('Office location saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save office location');
    } finally {
      setSavingLocation(false);
    }
  };

  const getUserDistributionData = () => [
    { name: 'Employees', value: stats.totalEmployees, color: COLORS[0] },
    { name: 'Managers', value: stats.totalManagers, color: COLORS[1] },
    { name: 'HR Managers', value: stats.totalHRManagers, color: COLORS[2] }
  ];

  const getAttendanceModeData = () => [
    { name: 'Face Recognition', value: stats.faceRecognitionCount },
    { name: 'Manual', value: stats.manualCount }
  ];

  const getWeeklyTrendData = () => {
    // Mock data for weekly trend
    return [
      { day: 'Mon', attendance: 85 },
      { day: 'Tue', attendance: 88 },
      { day: 'Wed', attendance: 82 },
      { day: 'Thu', attendance: 90 },
      { day: 'Fri', attendance: 87 },
      { day: 'Sat', attendance: 75 }
    ];
  };

  const getSubjectPerformanceData = () => {
    // Mock data for subject performance
    return [
      { subject: 'Engineering', present: 120, absent: 20 },
      { subject: 'Marketing', present: 110, absent: 30 },
      { subject: 'Sales', present: 115, absent: 25 },
      { subject: 'Support', present: 130, absent: 10 },
      { subject: 'Design', present: 125, absent: 15 }
    ];
  };

  const exportSystemReport = () => {
    const report = {
      generatedAt: new Date().toLocaleString(),
      stats,
      recentActivities: systemActivities,
      userDistribution: getUserDistributionData(),
      attendanceMode: getAttendanceModeData()
    };

    const reportContent = JSON.stringify(report, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_report_${new Date().toLocaleDateString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('System report exported');
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
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>+{trend}%</span>
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </motion.div>
  );

  const userDistribution = getUserDistributionData();
  const attendanceModeData = getAttendanceModeData();
  const weeklyTrend = getWeeklyTrendData();
  const subjectPerformance = getSubjectPerformanceData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg shadow-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Control Center
              </h1>
              <p className="text-xs text-gray-500 font-medium">WorkSphere HRMS Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-100 dark:border-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                System Active
              </span>
            </div>
            
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">System Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                {user?.name?.[0] || 'A'}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all font-semibold border border-red-100"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header Content */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Shield className="text-indigo-600" size={32} />
                System Overview
              </h1>
              {loading && <RefreshCw className="animate-spin text-indigo-600 w-5 h-5" />}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, Administrator. Here's what's happening today.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all ${loading ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={18} />
              <span>{loading ? 'Updating...' : 'Refresh Data'}</span>
            </button>
            <button
              onClick={exportSystemReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all"
            >
              <Download size={18} />
              <span>Export Reports</span>
            </button>
            <a
              href="/dashboard/admin/confessions"
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700"
            >
              <Shield className="w-5 h-5" />
              Anonymous Feedback
            </a>
            <Link
              to="/dashboard/admin/profile"
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500 hover:border-primary-600 transition-all flex-shrink-0 bg-gray-100 dark:bg-gray-700"
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={stats.totalEmployees}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
            trend={5}
          />
          <StatCard
            icon={BookOpen}
            label="Total Managers"
            value={stats.totalManagers}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-900/20"
            trend={3}
          />
          <StatCard
            icon={Users}
            label="Total HR Managers"
            value={stats.totalHRManagers}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
            trend={4}
          />
          <StatCard
            icon={UserCheck}
            label="Attendance Rate"
            value={`${stats.overallAttendanceRate}%`}
            color="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">User Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance Mode Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">Attendance Mode Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceModeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Face Recognition</p>
                <p className="text-2xl font-bold text-blue-600">{stats.faceRecognitionCount}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Manual</p>
                <p className="text-2xl font-bold text-gray-600">{stats.manualCount}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Attendance Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">Weekly Attendance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Subject Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">Department-wise Attendance Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* System Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            Recent System Activities
          </h2>
          <div className="space-y-3">
            {systemActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.type === 'Face Recognition'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Office Location Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            Office Location Settings (Geolocation Attendance)
          </h2>
          {officeLocation && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Current: {officeLocation.locationName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Lat: {officeLocation.latitude?.toFixed(6)}, Lng: {officeLocation.longitude?.toFixed(6)} | Radius: {officeLocation.radius}m
              </p>
              <p className="text-xs text-gray-500 mt-1">Set by: {officeLocation.setBy} on {new Date(officeLocation.updatedAt).toLocaleString()}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Office / Location Name</label>
                <input type="text" value={officeName} onChange={e => setOfficeName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input type="number" step="any" value={manualLat} onChange={e => setManualLat(e.target.value)}
                    placeholder="e.g. 12.9716" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input type="number" step="any" value={manualLng} onChange={e => setManualLng(e.target.value)}
                    placeholder="e.g. 77.5946" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allowed Radius: {officeRadius}m</label>
                <input type="range" min={50} max={500} step={10} value={officeRadius} onChange={e => setOfficeRadius(Number(e.target.value))}
                  className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>50m</span><span>500m</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-3 justify-center">
              <button onClick={handleUseCurrentLocation} disabled={gettingLocation}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                <Navigation className="w-5 h-5" />
                {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
              </button>
              <button onClick={handleSaveOfficeLocation} disabled={savingLocation}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
                <Save className="w-5 h-5" />
                {savingLocation ? 'Saving...' : 'Save Office Location'}
              </button>
              <p className="text-xs text-gray-500 text-center">Employees must be within {officeRadius}m of this location to mark attendance.</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Attendance Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Recent Employee Attendance Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Work Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
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
                {recentLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {log.empid || log.usn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {log.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(log.date).toLocaleDateString()}
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
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
