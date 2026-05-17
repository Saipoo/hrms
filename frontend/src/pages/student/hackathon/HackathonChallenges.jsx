import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Search, Filter, Clock, Users, Award, 
  ChevronRight, Calendar, Target, Code, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../../constants/menuItems';
import { useAuth } from '../../../context/AuthContext';

const HackathonChallenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('explore'); // explore or my-hackathons

  const domains = ['all', 'Artificial Intelligence', 'Blockchain', 'Cloud Computing', 
                   'Mobile Development', 'Cybersecurity', 'Data Science', 'Game Development', 'IoT & Hardware'];
  const statuses = ['all', 'upcoming', 'active', 'completed'];

  useEffect(() => {
    fetchHackathons();
    fetchMyParticipations();
  }, [selectedDomain, selectedStatus]);

  const fetchHackathons = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/hackathons?`;
      
      if (selectedDomain !== 'all') url += `domain=${selectedDomain}&`;
      if (selectedStatus !== 'all') url += `status=${selectedStatus}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setHackathons(data.data);
      } else {
        setHackathons([]);
      }
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyParticipations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hackathons/my-participations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setMyParticipations(data.data);
      } else {
        setMyParticipations([]);
      }
    } catch (error) {
      console.error('Error fetching participations:', error);
      setMyParticipations([]);
    }
  };

  const handleJoinHackathon = (hackathonId) => {
    navigate(`/dashboard/student/hackathon/${hackathonId}`);
  };

  const filteredHackathons = hackathons.filter(hackathon =>
    hackathon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hackathon.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hackathon.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-500';
      case 'Intermediate': return 'from-blue-500 to-cyan-500';
      case 'Advanced': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      evaluation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status] || styles.upcoming;
  };

  const getTimeRemaining = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Starts in ${days}d ${hours}h`;
    } else if (now >= start && now <= end) {
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hours}h ${minutes}m`;
    } else {
      return 'Ended';
    }
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Innovation Hackathons"
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-6">

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'explore'
              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Search className="w-5 h-5 inline mr-2" />
          Explore Hackathons
        </button>
        <button
          onClick={() => setActiveTab('my-hackathons')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'my-hackathons'
              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Trophy className="w-5 h-5 inline mr-2" />
          My Hackathons ({myParticipations.length})
        </button>
      </div>

      {/* Explore Tab */}
      {activeTab === 'explore' && (
        <>
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
              </div>

              {/* Domain Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none cursor-pointer"
                >
                  {domains.map(domain => (
                    <option key={domain} value={domain}>
                      {domain === 'all' ? 'All Domains' : domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none cursor-pointer"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Hackathons Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading hackathons...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredHackathons.map((hackathon, index) => (
                  <motion.div
                    key={hackathon._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-white/20"
                  >
                    {/* Status & Time */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(hackathon.status)}`}>
                        {hackathon.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(hackathon.startDate, hackathon.endDate)}
                      </span>
                    </div>

                    {/* Title & Theme */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{hackathon.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{hackathon.theme}</p>

                    {/* Domain */}
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-600 rounded-full text-xs font-semibold mb-4">
                      {hackathon.domain}
                    </span>

                    {/* Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getDifficultyColor(hackathon.difficulty)} text-white`}>
                        {hackathon.difficulty}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hackathon.duration}h
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-600 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {hackathon.type === 'team' ? `Teams of ${hackathon.maxTeamSize}` : 'Individual'}
                      </span>
                    </div>

                    {/* Prizes */}
                    <div className="mb-4 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Award className="w-3 h-3 text-yellow-600" />
                        Prize Pool
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        ₹{hackathon.prizes.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Participants */}
                    {hackathon.totalParticipants > 0 && (
                      <div className="mb-4 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {hackathon.totalParticipants} participants
                        </span>
                        <span className="text-gray-600">
                          {hackathon.totalTeams} teams
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleJoinHackathon(hackathon._id)}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                      View Details
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredHackathons.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No hackathons found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}

      {/* My Hackathons Tab */}
      {activeTab === 'my-hackathons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!Array.isArray(myParticipations) || myParticipations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No hackathons yet</p>
              <p className="text-gray-400 text-sm mb-4">Join a hackathon to get started</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Explore Hackathons
              </button>
            </div>
          ) : (
            myParticipations.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-white/20 cursor-pointer"
                onClick={() => navigate(`/dashboard/student/hackathon/${team.hackathonId._id}/room`)}
              >
                {/* Status & Rank */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(team.hackathonId.status)}`}>
                    {team.hackathonId.status.toUpperCase()}
                  </span>
                  {team.rank && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Rank #{team.rank}
                    </span>
                  )}
                </div>

                {/* Hackathon Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">{team.hackathonId.title}</h3>

                {/* Team Name */}
                <div className="mb-4 p-3 bg-teal-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-600">Team: {team.teamName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {team.members.length} members
                  </p>
                </div>

                {/* Progress/Score */}
                {team.finalScore !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-600">Final Score</span>
                      <span className="text-sm font-bold text-green-600">{team.finalScore.toFixed(1)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${team.finalScore}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                  {team.hackathonId.status === 'active' ? 'Continue Working' : 'View Details'}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default HackathonChallenges;
