import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  Calendar,
  TrendingUp,
  Bell,
  BookOpen,
  Clock,
  Download,
  RefreshCw,
  Video,
  Award,
  FileText,
  Briefcase,
  ChevronRight,
  Code,
  Trophy,
  HelpCircle,
  Info,
  Heart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { initializeSocket, getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const HRDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [interviewReports, setInterviewReports] = useState([]);
  const [internships, setInternships] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    setupSocketConnection();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('attendanceMarked');
      }
    };
  }, []);

  const setupSocketConnection = () => {
    initializeSocket();
    const socket = getSocket();

    if (socket) {
      socket.on('attendanceMarked', (data) => {
        if (data.usn === user.linkedEmpId) {
          const message = `${data.name} marked ${data.status.toLowerCase()} for ${data.subject}`;
          toast.success(message, { duration: 5000 });
          setNotifications(prev => [{
            message,
            time: new Date().toLocaleTimeString(),
            status: data.status
          }, ...prev].slice(0, 10));
          fetchDashboardData(); // Refresh data
        }
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check if user has linkedStudentUSN
      if (!user.linkedEmpId) {
        toast.error('No employee linked to this HR account');
        setLoading(false);
        return;
      }

      // Fetch employee attendance info
      const studentResponse = await api.get(`/attendance/employee/${user.linkedEmpId}`);
      console.log('📊 Student attendance response:', studentResponse.data);
      console.log('📊 Attendance logs count:', studentResponse.data?.data?.length || 0);
      console.log('📊 First few logs:', studentResponse.data?.data?.slice(0, 3));
      
      if (studentResponse.data.success) {
        // Get student basic info from user context or fetch separately
        const logs = studentResponse.data.data || [];
        console.log('📊 Processing', logs.length, 'attendance logs');
        
        // If we have logs, extract student info from the first log
        if (logs.length > 0) {
          setStudentInfo({
            empid: logs[0].usn,
            name: logs[0].studentName,
            department: logs[0].department,
            class: logs[0].class,
            section: logs[0].section
          });
        } else {
          // Fallback: try to get student from Student model
          try {
            const studentInfoRes = await api.get(`/auth/employee/${user.linkedEmpId}`);
            if (studentInfoRes.data.success) {
              setStudentInfo(studentInfoRes.data.data);
            }
          } catch (err) {
            console.warn('Could not fetch student info:', err);
          }
        }
        
        setAttendanceData(logs);
        processAttendanceData(logs);
      }

      // Fetch student's enrolled courses
      if (user.linkedStudentUSN) {
        try {
          const coursesResponse = await api.get(`/courses/employee/${user.linkedEmpId}/enrollments`);
          console.log('📚 Student courses:', coursesResponse.data);
          if (coursesResponse.data.success) {
            setEnrolledCourses(coursesResponse.data.data || []);
          }
        } catch (err) {
          console.error('Error fetching courses:', err);
        }

        // Fetch student's certificates
        try {
          const certsResponse = await api.get(`/courses/employee/${user.linkedEmpId}/certificates`);
          console.log('🏆 Student certificates:', certsResponse.data);
          if (certsResponse.data.success) {
            setCertificates(certsResponse.data.data || []);
          }
        } catch (err) {
          console.error('Error fetching certificates:', err);
        }

        // Fetch student's interview reports
        try {
          console.log('🎤 Fetching interview reports for Employee ID:', user.linkedEmpId);
          const interviewResponse = await api.get(`/interview/results/${user.linkedEmpId}`);
          console.log('🎤 Student interview reports response:', interviewResponse.data);
          if (interviewResponse.data.success) {
            const reports = interviewResponse.data.data || [];
            console.log(`✅ Found ${reports.length} interview reports`);
            setInterviewReports(reports);
          } else {
            console.log('⚠️ API returned success: false');
            setInterviewReports([]);
          }
        } catch (err) {
          console.error('❌ Error fetching interview reports:', err);
          console.error('Error details:', err.response?.data || err.message);
          if (err.response?.status === 403) {
            console.error('🔒 Authorization error - linkedStudentUSN may not match');
          }
          setInterviewReports([]);
        }

        // Fetch internship data
        try {
          console.log('💼 Fetching internship data for Employee ID:', user.linkedEmpId);
          const internshipResponse = await api.get(`/internships/employee/${user.linkedEmpId}`);
          if (internshipResponse.data.success) {
            setInternships(internshipResponse.data.data.enrollments || []);
            console.log(`✅ Found ${internshipResponse.data.data.enrollments.length} internships`);
          }
        } catch (err) {
          console.error('❌ Error fetching internship data:', err);
          setInternships([]);
        }

        // Fetch hackathon data
        try {
          console.log('🏆 Fetching hackathon data for Employee ID:', user.linkedEmpId);
          const hackathonResponse = await api.get(`/hackathons/employee/${user.linkedEmpId}`);
          if (hackathonResponse.data.success) {
            setHackathons(hackathonResponse.data.data.teams || []);
            console.log(`✅ Found ${hackathonResponse.data.data.teams.length} hackathons`);
          }
        } catch (err) {
          console.error('❌ Error fetching hackathon data:', err);
          setHackathons([]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Check console for details.');
      // Set empty data to prevent errors
      setAttendanceData([]);
      processAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (logs) => {
    console.log('📊 processAttendanceData called with:', logs?.length || 0, 'logs');
    
    if (!logs || !Array.isArray(logs)) {
      logs = [];
    }
    
    const totalClasses = logs.length;
    const present = logs.filter(log => log.status === 'Present').length;
    const absent = logs.filter(log => log.status === 'Absent').length;
    const percentage = totalClasses > 0 ? ((present / totalClasses) * 100).toFixed(1) : 0;

    setStats({
      totalClasses,
      present,
      absent,
      percentage
    });

    // Set recent logs (last 10)
    const recentLogsData = logs.slice(0, 10);
    console.log('📊 Setting recentLogs:', recentLogsData.length, 'entries');
    setRecentLogs(recentLogsData);
  };

  const getSubjectWiseData = () => {
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return [];
    }
    
    const subjectMap = {};
    attendanceData.forEach(log => {
      if (!subjectMap[log.subject]) {
        subjectMap[log.subject] = { subject: log.subject, Present: 0, Absent: 0 };
      }
      if (log.status === 'Present') {
        subjectMap[log.subject].Present++;
      } else {
        subjectMap[log.subject].Absent++;
      }
    });
    return Object.values(subjectMap);
  };

  const getTrendData = () => {
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return [];
    }
    
    // Get last 30 days attendance trend
    const today = new Date();
    const last30Days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = attendanceData.filter(log => 
        new Date(log.date).toISOString().split('T')[0] === dateStr
      );
      
      const present = dayLogs.filter(log => log.status === 'Present').length;
      const total = dayLogs.length;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : 0;
      
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendance: parseFloat(percentage)
      });
    }
    
    return last30Days;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Subject', 'Status', 'Time', 'Mode'];
    const rows = attendanceData.map(log => [
      new Date(log.date).toLocaleDateString(),
      log.subject,
      log.status,
      log.time,
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
    a.download = `${user.linkedEmpId}_attendance_${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendance data exported');
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
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </motion.div>
  );



  const subjectWiseData = getSubjectWiseData();
  const trendData = getTrendData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome, {user?.name}! 🏢
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your employee's attendance and performance in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/mentor-connect"
              className="btn btn-primary flex items-center gap-2"
            >
              <Video className="w-5 h-5" />
              Manager Connect
            </Link>
            <Link
              to="/dashboard/hr/faq"
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <HelpCircle className="w-5 h-5" />
              FAQs & Help
            </Link>
            <Link
              to="/dashboard/hr/about"
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Info className="w-5 h-5" />
              About
            </Link>
            <Link
              to="/dashboard/hr/grades"
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <TrendingUp className="w-5 h-5" />
              Performance Reports
            </Link>
            <Link
              to="/dashboard/hr/wellbeing"
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Heart className="w-5 h-5" />
              Employee Wellbeing
            </Link>
            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <Link
              to="/dashboard/hr/profile"
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500 hover:border-primary-600 transition-all flex-shrink-0 bg-gray-100 dark:bg-gray-700"
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </Link>
            <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        {studentInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{studentInfo.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="opacity-80">Employee ID</p>
                    <p className="font-semibold">{studentInfo.empid}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Department</p>
                    <p className="font-semibold">{studentInfo.department}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Class</p>
                    <p className="font-semibold">{studentInfo.class}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Section</p>
                    <p className="font-semibold">{studentInfo.section}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
            icon={TrendingUp}
            label="Days Present"
            value={stats.present}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <StatCard
            icon={Clock}
            label="Days Absent"
            value={stats.absent}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-900/20"
          />
          <StatCard
            icon={BookOpen}
            label="Attendance Rate"
            value={`${stats.percentage}%`}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
        </div>

        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-600" />
              Real-time Updates
            </h2>
            <div className="space-y-2">
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    notif.status === 'Present'
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{notif.message}</p>
                    <span className="text-xs text-gray-500">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject-wise Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">Department-wise Attendance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" />
                <Bar dataKey="Absent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4">30-Day Attendance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Enrolled Courses Section */}
        {enrolledCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary-600" />
              Enrolled Training Programs ({enrolledCourses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-2">
                      {enrollment.course?.title || 'Unknown Course'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      enrollment.progress >= 100
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : enrollment.progress >= 50
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {enrollment.progress >= 100 ? 'Completed' : enrollment.progress > 0 ? 'In Progress' : 'Started'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{enrollment.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    </div>
                    {enrollment.lastAccessedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Last accessed: {new Date(enrollment.lastAccessedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {enrollment.completedAt && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Completed: {new Date(enrollment.completedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              Certificates Earned ({certificates.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                        {cert.course?.title || cert.courseName || 'Certificate'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cert.studentName}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>Issued: {new Date(cert.issueDate || cert.issuedDate || cert.completionDate).toLocaleDateString()}</span>
                    </div>
                    {cert.certificateId && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        <span className="font-mono text-[10px]">{cert.certificateId}</span>
                      </div>
                    )}
                  </div>

                  {(cert.pdfUrl || cert.certificateUrl) && (
                    <a
                      href={`http://localhost:5000${cert.pdfUrl || cert.certificateUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interview Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            Interview Prep Performance ({interviewReports.length})
          </h2>
          {interviewReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewReports.slice(0, 4).map((report) => (
                <Link
                  key={report._id}
                  to={`/dashboard/employee/interview/results/${report._id}`}
                  className="border-2 border-primary-200 dark:border-primary-700 rounded-lg p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                        {report.category} Interview
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.domain} - {report.role}
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${
                      report.scores.overall >= 80 
                        ? 'text-green-600' 
                        : report.scores.overall >= 60 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {report.scores.overall}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="text-center">
                      <p className="font-semibold">{report.scores.confidence}</p>
                      <p>Confidence</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{report.scores.communication}</p>
                      <p>Comm.</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{report.scores.technical}</p>
                      <p>Technical</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{report.scores.problemSolving}</p>
                      <p>Problem</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.completedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                      <span>View Report</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
              {interviewReports.length > 4 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/dashboard/employee/interview"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                  >
                    View All Interview Reports
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No interview reports available yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                This employee hasn't completed any mock interviews yet.
              </p>
            </div>
          )}
        </motion.div>

        {/* Internship Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-blue-600" />
            Onboarding & Training Progress ({internships.length})
          </h2>
          {internships.length > 0 ? (
            <div className="space-y-4">
              {internships.slice(0, 3).map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                        {enrollment.role}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold">
                        {enrollment.company}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs capitalize ${
                        enrollment.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {enrollment.completedTasks || 0}/{enrollment.totalTasks}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tasks</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{Math.round(((enrollment.completedTasks || 0) / enrollment.totalTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                        style={{ width: `${((enrollment.completedTasks || 0) / enrollment.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    </div>
                    {enrollment.status === 'completed' && (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No internships enrolled yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Your child hasn't enrolled in any internships yet.
              </p>
            </div>
          )}
        </motion.div>

        {/* Hackathon Participation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-green-600" />
            Hackathon Participation ({hackathons.length})
          </h2>
          {hackathons.length > 0 ? (
            <div className="space-y-4">
              {hackathons.slice(0, 3).map((team) => (
                <div
                  key={team._id}
                  className="border-2 border-green-200 dark:border-green-700 rounded-lg p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                        {team.teamName}
                      </h3>
                      <p className="text-green-600 dark:text-green-400 font-semibold">
                        {team.hackathonId?.title || 'Hackathon Event'}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs capitalize ${
                        team.hackathonId?.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : team.hackathonId?.status === 'active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {team.hackathonId?.status || 'active'}
                      </span>
                    </div>
                    {team.projectSubmission && (
                      <div className="text-right">
                        <div className="text-green-600 font-bold">
                          ✓ Submitted
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Team Members:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {team.members?.slice(0, 3).map((member, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {member.name}
                        </span>
                      ))}
                      {team.members?.length > 3 && (
                        <span className="px-2 py-1 text-gray-600 dark:text-gray-400 text-xs">
                          +{team.members.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {team.projectSubmission && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {team.projectSubmission.title}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined: {new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
                    {team.teamLeader?.usn === user.linkedStudentUSN && (
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        Team Leader
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No hackathon participation yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Your child hasn't joined any hackathons yet.
              </p>
            </div>
          )}
        </motion.div>

        {/* Recent Attendance Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Recent Attendance History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
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
                {(() => {
                  console.log('🎯 Rendering attendance table with recentLogs:', recentLogs.length);
                  return null;
                })()}
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.subject}
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
                        <span className="text-xs text-gray-500">{log.mode}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No attendance records found
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

export default HRDashboard;
