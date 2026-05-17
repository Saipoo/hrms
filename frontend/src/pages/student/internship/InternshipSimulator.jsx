import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Building2, Clock, TrendingUp, Search, Filter,
  ChevronRight, Award, BookOpen, Users, Code, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../../constants/menuItems';
import { useAuth } from '../../../context/AuthContext';

const InternshipSimulator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('explore'); // explore or my-internships

  const domains = ['all', 'Web Development', 'Data Science', 'Cloud Computing', 'Mobile Development', 
                   'Machine Learning', 'Artificial Intelligence', 'Cybersecurity', 'Full Stack Development'];
  const skillLevels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    fetchInternships();
    fetchMyEnrollments();
  }, [selectedDomain, selectedSkillLevel]);

  const fetchInternships = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/internships?`;
      
      if (selectedDomain !== 'all') url += `domain=${selectedDomain}&`;
      if (selectedSkillLevel !== 'all') url += `skillLevel=${selectedSkillLevel}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setInternships(data.data);
      } else {
        setInternships([]);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/internships/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setMyEnrollments(data.data);
      } else {
        setMyEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setMyEnrollments([]);
    }
  };

  const handleEnroll = async (internshipId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔵 Enrolling in internship:', internshipId);
      
      const response = await fetch('http://localhost:5000/api/internships/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ internshipId })
      });
      
      const data = await response.json();
      console.log('📦 Enrollment response:', data);
      
      if (data.success) {
        alert('✅ Successfully enrolled! Your tasks have been generated.');
        navigate(`/dashboard/student/internship/${data.data._id}/workspace`);
      } else {
        console.error('❌ Enrollment failed:', data);
        alert(`❌ ${data.message || 'Failed to enroll'}`);
      }
    } catch (error) {
      console.error('💥 Error enrolling:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  const filteredInternships = internships.filter(internship =>
    internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSkillLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return 'from-green-500 to-emerald-500';
      case 'Intermediate': return 'from-blue-500 to-cyan-500';
      case 'Advanced': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      enrolled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'in-progress': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return styles[status] || styles.enrolled;
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Onboarding Center"
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'explore'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Search className="w-5 h-5 inline mr-2" />
          Explore Internships
        </button>
        <button
          onClick={() => setActiveTab('my-internships')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'my-internships'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white'
          }`}
        >
          <Briefcase className="w-5 h-5 inline mr-2" />
          My Internships ({myEnrollments.length})
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
                  placeholder="Search by company or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              {/* Domain Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none cursor-pointer"
                >
                  {domains.map(domain => (
                    <option key={domain} value={domain}>
                      {domain === 'all' ? 'All Domains' : domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Level Filter */}
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedSkillLevel}
                  onChange={(e) => setSelectedSkillLevel(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none cursor-pointer"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Internships Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading internships...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredInternships.map((internship, index) => (
                  <motion.div
                    key={internship._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-white/20"
                  >
                    {/* Company Logo & Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{internship.company}</h3>
                          <p className="text-sm text-gray-500">{internship.domain}</p>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{internship.role}</h4>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{internship.description}</p>

                    {/* Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getSkillLevelColor(internship.skillLevel)} text-white`}>
                        {internship.skillLevel}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {internship.duration} weeks
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-600 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {internship.tasksCount} tasks
                      </span>
                    </div>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        You'll Learn:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {internship.learningObjectives.slice(0, 3).map((obj, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span className="line-clamp-1">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Enroll Button */}
                    <button
                      onClick={() => handleEnroll(internship._id)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                      Enroll Now
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredInternships.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No internships found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}

      {/* My Internships Tab */}
      {activeTab === 'my-internships' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myEnrollments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No internships yet</p>
              <p className="text-gray-400 text-sm mb-4">Enroll in an internship to get started</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Explore Internships
              </button>
            </div>
          ) : (
            myEnrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-white/20 cursor-pointer"
                onClick={() => navigate(`/dashboard/student/internship/${enrollment._id}/workspace`)}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(enrollment.status)}`}>
                    {enrollment.status.replace('-', ' ').toUpperCase()}
                  </span>
                  {enrollment.certificateId && (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                {/* Company & Role */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {enrollment.internshipId?.company}
                    </h3>
                    <p className="text-sm text-gray-500">{enrollment.internshipId?.role}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-blue-600">{Math.round(enrollment.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{enrollment.tasksCompleted}</p>
                    <p className="text-xs text-gray-600">Tasks Done</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{enrollment.overallScore?.toFixed(1) || 0}</p>
                    <p className="text-xs text-gray-600">Avg Score</p>
                  </div>
                </div>

                {/* Continue Button */}
                <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                  Continue Working
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

export default InternshipSimulator;
