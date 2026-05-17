import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Search, 
  Users, 
  Award,
  Target,
  ArrowLeft,
  Star,
  Medal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HackathonReports = () => {
  const [loading, setLoading] = useState(true);
  const [searchUSN, setSearchUSN] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    setLoading(false);
  }, []);

  const searchStudent = async () => {
    if (!searchUSN.trim()) {
      toast.error('Please enter a USN');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/hackathons/student/${searchUSN.toUpperCase()}`);
      
      if (response.data.success) {
        setStudentData(response.data.data);
        setViewMode('student');
        toast.success('Student data loaded');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error(error.response?.data?.message || 'Failed to load student data');
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'upcoming':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Award className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <Star className="w-6 h-6 text-gray-400" />;
  };

  if (loading && viewMode === 'all') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard/teacher"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Hackathon Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor student hackathon participation and achievements
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchUSN}
                onChange={(e) => setSearchUSN(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
                placeholder="Enter Student USN..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchStudent}
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </motion.div>

        {/* Student Data Display */}
        {studentData && viewMode === 'student' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-gradient-to-br from-green-500 to-teal-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="w-12 h-12 opacity-80" />
                  <Users className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.teams.length}
                </h3>
                <p className="opacity-90">Total Hackathons</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="card bg-gradient-to-br from-yellow-500 to-orange-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-12 h-12 opacity-80" />
                  <Target className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.results.filter(r => r.rank <= 3).length}
                </h3>
                <p className="opacity-90">Top 3 Finishes</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card bg-gradient-to-br from-purple-500 to-pink-600 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Star className="w-12 h-12 opacity-80" />
                  <Medal className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {studentData.results.length > 0
                    ? Math.round(
                        studentData.results.reduce((sum, r) => sum + (r.totalScore || 0), 0) /
                          studentData.results.length
                      )
                    : 0}
                </h3>
                <p className="opacity-90">Avg Score</p>
              </motion.div>
            </div>

            {/* Teams List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-600" />
                Hackathon Participations
              </h2>
              <div className="space-y-4">
                {studentData.teams.length > 0 ? (
                  studentData.teams.map((team) => {
                    const result = studentData.results.find(
                      r => r.teamId?.toString() === team._id.toString()
                    );

                    return (
                      <div
                        key={team._id}
                        className="p-6 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {team.teamName}
                              </h3>
                              {result && result.rank && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                  {getRankIcon(result.rank)}
                                  <span className="font-bold text-yellow-700 dark:text-yellow-400">
                                    Rank #{result.rank}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-lg text-green-600 dark:text-green-400 font-semibold mb-2">
                              {team.hackathonId?.title || 'Hackathon'}
                            </p>
                            <div className="flex gap-2 flex-wrap mb-3">
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                {team.hackathonId?.domain || 'General'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(team.hackathonId?.status)}`}>
                                {team.hackathonId?.status || 'Unknown'}
                              </span>
                              {team.teamLeader?.usn === searchUSN.toUpperCase() && (
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                                  Team Leader
                                </span>
                              )}
                            </div>

                            {/* Team Members */}
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Team Members ({team.members?.length || 0}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {team.members?.map((member, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                                  >
                                    {member.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {result && (
                            <div className="text-right ml-4">
                              <div className="text-3xl font-bold text-green-600">
                                {result.totalScore || 0}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Total Score</p>
                            </div>
                          )}
                        </div>

                        {/* Project Submission */}
                        {team.projectSubmission && (
                          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h4 className="font-semibold mb-2">Project Submission:</h4>
                            <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                              {team.projectSubmission.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {team.projectSubmission.description}
                            </p>
                            <div className="flex gap-3 text-sm">
                              {team.projectSubmission.githubUrl && (
                                <a
                                  href={team.projectSubmission.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {team.projectSubmission.demoUrl && (
                                <a
                                  href={team.projectSubmission.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Live Demo
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Score Breakdown */}
                        {result && result.scores && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg">
                            <h4 className="font-semibold mb-3">Score Breakdown:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {result.scores.codeQuality || 0}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Code Quality</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {result.scores.creativity || 0}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Creativity</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {result.scores.functionality || 0}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Functionality</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">
                                  {result.scores.uiUx || 0}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">UI/UX</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                  {result.scores.collaboration || 0}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Teamwork</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Joined:</span>{' '}
                            {new Date(team.createdAt).toLocaleDateString()}
                          </div>
                          {team.projectSubmission?.submittedAt && (
                            <div>
                              <span className="font-medium">Submitted:</span>{' '}
                              {new Date(team.projectSubmission.submittedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hackathon participations found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* No Results */}
        {!studentData && viewMode === 'student' && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a student USN and click search to view their hackathon data
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HackathonReports;
