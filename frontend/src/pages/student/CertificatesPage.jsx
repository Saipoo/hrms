import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Download,
  Eye,
  Calendar,
  BookOpen,
  FileText,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';


const CertificatesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, course, grade
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, filterType, searchQuery]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      
      // Fetch course certificates
      const courseRes = await api.get('/courses/my-certificates');
      const courseCerts = (courseRes.data.certificates || []).map(cert => ({
        ...cert,
        type: 'course',
        icon: BookOpen
      }));

      // Fetch grademaster certificates (if endpoint exists)
      let gradeCerts = [];
      try {
        const gradeRes = await api.get('/grades/my-certificates');
        gradeCerts = (gradeRes.data.certificates || []).map(cert => ({
          ...cert,
          type: 'grade',
          icon: FileText
        }));
      } catch (error) {
        console.log('GradeMaster certificates not available');
      }

      const allCertificates = [...courseCerts, ...gradeCerts].sort(
        (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
      );

      setCertificates(allCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = certificates;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(cert => cert.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(cert =>
        (cert.courseName || cert.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCertificates(filtered);
  };

  const handleDownload = (certificate) => {
    if (certificate.certificateUrl || certificate.url) {
      window.open(certificate.certificateUrl || certificate.url, '_blank');
      toast.success('Opening certificate...');
    } else {
      toast.error('Certificate URL not available');
    }
  };

  const handleView = (certificate) => {
    if (certificate.certificateUrl || certificate.url) {
      window.open(certificate.certificateUrl || certificate.url, '_blank');
    } else {
      toast.error('Certificate URL not available');
    }
  };

  const CertificateCard = ({ certificate }) => {
    const Icon = certificate.icon || Award;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`bg-gradient-to-br ${
          certificate.type === 'course'
            ? 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30'
            : 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30'
        } rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${
            certificate.type === 'course'
              ? 'bg-blue-500 text-white'
              : 'bg-purple-500 text-white'
          }`}>
            <Icon className="w-8 h-8" />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            certificate.type === 'course'
              ? 'bg-blue-500 text-white'
              : 'bg-purple-500 text-white'
          }`}>
            {certificate.type === 'course' ? 'CourseMaster' : 'GradeMaster'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          {certificate.courseName || certificate.subject || 'Certificate'}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Issued: {new Date(certificate.issueDate || certificate.completionDate).toLocaleDateString()}</span>
          </div>
          {certificate.score && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Award className="w-4 h-4" />
              <span>Score: {certificate.score}%</span>
            </div>
          )}
          {certificate.certificateId && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              ID: {certificate.certificateId}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleView(certificate)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:shadow-md transition-all"
          >
            <Eye className="w-4 h-4" />
            <span className="font-medium">View</span>
          </button>
          <button
            onClick={() => handleDownload(certificate)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${
              certificate.type === 'course'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Achievements & Badges"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({certificates.length})
              </button>
              <button
                onClick={() => setFilterType('course')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'course'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Training Programs ({certificates.filter(c => c.type === 'course').length})
              </button>
              <button
                onClick={() => setFilterType('grade')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'grade'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Performance Reviews ({certificates.filter(c => c.type === 'grade').length})
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        {certificates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/30 rounded-xl p-6 shadow-lg">
              <Award className="w-10 h-10 text-yellow-600 mb-3" />
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                {certificates.length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl p-6 shadow-lg">
              <BookOpen className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                {certificates.filter(c => c.type === 'course').length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Training Programs</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30 rounded-xl p-6 shadow-lg">
              <FileText className="w-10 h-10 text-purple-600 mb-3" />
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                {certificates.filter(c => c.type === 'grade').length}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance Reviews</p>
            </div>
          </motion.div>
        )}

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate, index) => (
              <CertificateCard key={index} certificate={certificate} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Award className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {searchQuery || filterType !== 'all' 
                ? 'No certificates found' 
                : 'No certificates yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Complete courses and assignments to earn certificates'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => window.location.href = '/dashboard/student/course-master'}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Browse Courses
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
