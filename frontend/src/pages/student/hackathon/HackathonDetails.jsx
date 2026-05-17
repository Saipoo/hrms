import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Trophy, Clock, Users, Award, Calendar, Target,
  CheckCircle, BookOpen, AlertCircle, ChevronRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../../constants/menuItems';
import { useAuth } from '../../../context/AuthContext';

const HackathonDetails = () => {
  const { user } = useAuth();
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  useEffect(() => {
    fetchHackathonDetails();
    checkMyTeam();
  }, [hackathonId]);

  const fetchHackathonDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hackathons/${hackathonId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setHackathon(data.data);
      }
    } catch (error) {
      console.error('Error fetching hackathon:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMyTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hackathons/${hackathonId}/my-team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // 404 is expected if user hasn't joined yet - not an error
      if (response.status === 404) {
        setMyTeam(null);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setMyTeam(data.data);
      }
    } catch (error) {
      console.error('Error checking team:', error);
    }
  };

  const handleJoin = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hackathons/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hackathonId, teamName })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Successfully joined hackathon! Your problem statement has been generated.');
        navigate(`/dashboard/student/hackathon/${hackathonId}/room`);
      } else {
        alert(data.message || 'Failed to join hackathon');
      }
    } catch (error) {
      console.error('Error joining hackathon:', error);
      alert('Failed to join hackathon');
    } finally {
      setJoining(false);
    }
  };

  const getTimeRemaining = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return { text: `Starts in ${days}d ${hours}h`, type: 'upcoming' };
    } else if (now >= start && now <= end) {
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { text: `Ends in ${hours}h ${minutes}m`, type: 'active' };
    } else {
      return { text: 'Ended', type: 'ended' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading hackathon...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Hackathon not found</p>
          <button
            onClick={() => navigate('/dashboard/student/hackathon')}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
          >
            Back to Hackathons
          </button>
        </div>
      </div>
    );
  }

  const timeInfo = getTimeRemaining(hackathon.startDate, hackathon.endDate);

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Innovation Hackathons"
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/dashboard/student/hackathon')}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Hackathons
          </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{hackathon.title}</h1>
              <p className="text-green-100 text-lg mb-4">{hackathon.theme}</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  {hackathon.domain}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  {hackathon.difficulty}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {hackathon.duration} hours
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className={`px-6 py-3 rounded-xl font-semibold mb-2 ${
                timeInfo.type === 'active' ? 'bg-green-400' : 
                timeInfo.type === 'upcoming' ? 'bg-blue-400' : 'bg-gray-400'
              }`}>
                {timeInfo.text}
              </div>
              <div className="text-5xl font-bold">
                ₹{hackathon.prizes.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </div>
              <p className="text-green-100 text-sm">Total Prize Pool</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{hackathon.maxTeamSize}</p>
              <p className="text-xs text-green-100">Max Team Size</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{hackathon.totalParticipants || 0}</p>
              <p className="text-xs text-green-100">Participants</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{hackathon.totalTeams || 0}</p>
              <p className="text-xs text-green-100">Teams</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{hackathon.prizes.length}</p>
              <p className="text-xs text-green-100">Prizes</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              About This Hackathon
            </h2>
            <p className="text-gray-600 leading-relaxed">{hackathon.description}</p>
          </motion.div>

          {/* Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Rules & Guidelines
            </h2>
            <ul className="space-y-3">
              {Array.isArray(hackathon.rules) && hackathon.rules.length > 0 ? (
                hackathon.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-600">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-600 font-semibold text-sm mt-0.5">
                      {index + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No rules specified</li>
              )}
            </ul>
          </motion.div>

          {/* Evaluation Criteria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-green-600" />
              Evaluation Criteria
            </h2>
            <div className="space-y-3">
              {Array.isArray(hackathon.evaluationCriteria) && hackathon.evaluationCriteria.length > 0 ? (
                hackathon.evaluationCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">{criteria.criteria || 'Criteria'}</span>
                        <span className="text-sm font-bold text-green-600">{criteria.weight || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full"
                          style={{ width: `${criteria.weight || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No evaluation criteria specified</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prizes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              Prizes
            </h3>
            <div className="space-y-3">
              {Array.isArray(hackathon.prizes) && hackathon.prizes.length > 0 ? (
                hackathon.prizes.map((prize, index) => (
                  <div key={prize.position || index} className="bg-white rounded-xl p-4 border-2 border-yellow-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">
                        {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : '🥉'} 
                        {' '}{prize.title || (prize.position === 1 ? 'First' : prize.position === 2 ? 'Second' : 'Third') + ' Prize'}
                      </span>
                    </div>
                    {prize.amount && (
                      <p className="text-2xl font-bold text-orange-600 mb-1">
                        ₹{prize.amount.toLocaleString()}
                      </p>
                    )}
                    {prize.description && (
                      <p className="text-sm text-gray-600">{prize.description}</p>
                    )}
                    {prize.benefits && Array.isArray(prize.benefits) && prize.benefits.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {prize.benefits.join(' • ')}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No prize information available</p>
              )}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" />
              Timeline
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Registration Deadline</p>
                <p className="font-semibold text-gray-800">
                  {new Date(hackathon.registrationDeadline).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(hackathon.startDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(hackathon.endDate).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Join Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky top-6"
          >
            {myTeam ? (
              <button
                onClick={() => navigate(`/dashboard/student/hackathon/${hackathonId}/room`)}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                Go to Team Room
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : hackathon.status === 'upcoming' || hackathon.status === 'active' ? (
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <Trophy className="w-5 h-5" />
                Join Hackathon
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-semibold">Hackathon has ended</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Hackathon</h2>
            <p className="text-gray-600 mb-6">
              Enter a team name to create your team. You can invite members later.
            </p>
            
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                disabled={joining}
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining || !teamName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default HackathonDetails;
