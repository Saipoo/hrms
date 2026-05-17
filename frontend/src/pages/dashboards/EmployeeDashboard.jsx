import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Clock,
  Calendar,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  TrendingUp,
  History,
  BookOpen,
  MessageSquare,
  Briefcase,
  Award,
  Code,
  Trophy,
  Target,
  Brain,
  FileText,
  Video,
  Newspaper,
  HelpCircle,
  Info,
  Building2,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import TodaysHighlights from '../../components/dashboard/TodaysHighlights';
import ConfessionModal from '../../components/ConfessionModal';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confessionModalOpen, setConfessionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [subjectWise, setSubjectWise] = useState({});

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await api.get('/attendance/my-attendance');
      if (response.data.success) {
        setStats(response.data.statistics.overall);
        setSubjectWise(response.data.statistics.subjectWise);
        setRecentAttendance(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-xl p-6 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-lg bg-white dark:bg-gray-800`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </motion.div>
  );


  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Employee Overview"
    >
      <div className="flex-1 min-w-0">
        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              label="Total Work Days"
              value={stats.totalClasses}
              color="text-blue-600"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatCard
              icon={CheckCircle}
              label="Days Present"
              value={stats.present}
              color="text-green-600"
              bgColor="bg-green-50 dark:bg-green-900/20"
            />
            <StatCard
              icon={XCircle}
              label="Days Absent"
              value={stats.absent}
              color="text-red-600"
              bgColor="bg-red-50 dark:bg-red-900/20"
            />
            <StatCard
              icon={TrendingUp}
              label="Attendance Rate"
              value={`${stats.percentage}%`}
              color="text-purple-600"
              bgColor="bg-purple-50 dark:bg-purple-900/20"
            />
          </div>

          {/* Today's Highlights Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <TodaysHighlights />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Link
              to="/dashboard/employee/face-register"
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-primary-500 to-primary-700 text-white"
            >
              <MapPin className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Biometric Registry</h3>
              <p className="opacity-90">Secure your profile with face recognition</p>
            </Link>

            <Link
              to="/dashboard/employee/mark-attendance"
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-green-500 to-green-700 text-white"
            >
              <CheckCircle className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Check-In / Out</h3>
              <p className="opacity-90">Log your daily work hours with location check</p>
            </Link>

            <Link
              to="/dashboard/employee/grade-master"
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-orange-500 to-red-500 text-white"
            >
              <TrendingUp className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">KPIs & Performance</h3>
              <p className="opacity-90">View your performance scorecards & metrics</p>
            </Link>

            <Link
              to="/dashboard/employee/course-master"
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-blue-500 to-purple-600 text-white"
            >
              <BookOpen className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Upskilling Portal</h3>
              <p className="opacity-90">Access mandatory and optional training</p>
            </Link>

            <Link
              to="/dashboard/employee/course-dashboard"
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-purple-500 to-pink-600 text-white"
            >
              <TrendingUp className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Learning Tracker</h3>
              <p className="opacity-90">Track your training progress and skills</p>
            </Link>
          </motion.div>

          {/* Department-wise Attendance */}
          {Object.keys(subjectWise).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-8"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Department-wise Attendance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(subjectWise).map(([subject, data]) => (
                  <div
                    key={subject}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <h3 className="font-semibold mb-2">{subject}</h3>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-600">Present: {data.present}</span>
                      <span className="text-red-600">Absent: {data.absent}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${data.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {data.percentage}% attendance
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary-600" />
              Recent Attendance Records
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Work Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {record.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'Present'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No attendance records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <Link to="/dashboard/employee/attendance-history" className="text-primary-600 hover:text-primary-700 font-medium">
                View Detailed Logs →
              </Link>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Anonymous Feedback Modal */}
      <ConfessionModal 
        isOpen={confessionModalOpen} 
        onClose={() => setConfessionModalOpen(false)} 
      />
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
