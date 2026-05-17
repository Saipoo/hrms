import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BookOpen, Search, Filter, Play, Award, Download, ArrowLeft, FileText, Video } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import VideoPlayer from '../../components/VideoPlayer';
import QuizComponent from '../../components/QuizComponent';
import CertificateViewer from '../../components/CertificateViewer';
import PageHeader from '../../components/PageHeader';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';

const CourseMaster = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse'); // browse, course-detail

  const categories = [
    'all',
    'Leadership',
    'Professional Skills',
    'Technical Training',
    'AI & Automation',
    'Compliance',
    'Wellbeing',
    'Software Engineering',
    'Data & Analytics',
    'Product Management',
    'Design',
    'Other'
  ];

  // Helper function to get userId from localStorage
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user._id || user.id || null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchMyEnrollments();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, categoryFilter]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: { category: categoryFilter !== 'all' ? categoryFilter : undefined }
      });
      setCourses(response.data.courses);
      setFilteredCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses/my-enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMyEnrollments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setMyEnrollments([]); // Set empty array on error
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/courses/enroll/${courseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Successfully enrolled in the course!');
      fetchCourses(); // Refresh courses
      fetchMyEnrollments(); // Refresh enrollments to show in "Continue Learning"
    } catch (error) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.message || 'Error enrolling in course');
    }
  };

  const handleViewCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserId();
      
      // Check if userId exists
      if (!userId) {
        alert('User session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      // Fetch course details
      const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedCourse(courseResponse.data.course);
      
      // Fetch all enrollments for this student
      const enrollmentResponse = await axios.get(
        `http://localhost:5000/api/courses/progress/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Find the enrollment for this specific course
      const courseEnrollment = enrollmentResponse.data.enrollments.find(
        e => e.courseId._id === courseId || e.courseId === courseId
      );
      
      if (courseEnrollment) {
        setEnrollment(courseEnrollment);
      }
      
      setView('course-detail');
      setSelectedVideo(null);
      setShowQuiz(false);
    } catch (error) {
      console.error('Error fetching course:', error);
      alert('Error loading course. Please try again.');
    }
  };

  const handleProgressUpdate = async (progressData) => {
    if (!enrollment) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/courses/progress/update',
        {
          enrollmentId: enrollment._id,
          ...progressData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleQuizSubmit = async (answers) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/courses/quiz/${selectedCourse._id}/submit`,
        {
          enrollmentId: enrollment._id,
          answers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/courses/generateCertificate/${selectedCourse._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCertificate(response.data.certificate);
      setShowCertificate(true);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert(error.response?.data?.message || 'Error generating certificate');
    }
  };

  const handleBackToBrowse = () => {
    setView('browse');
    setSelectedCourse(null);
    setSelectedVideo(null);
    setShowQuiz(false);
    setEnrollment(null);
  };

  // Browse View
  if (view === 'browse') {
    return (
      <DashboardLayout menuItems={EMPLOYEE_MENU} role={user?.role || 'student'}>
        <div className="min-h-screen">

        <div className="max-w-7xl mx-auto p-6">

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-gray-600">
              Found <span className="font-semibold">{filteredCourses.length}</span> courses
            </div>
          </div>

          {/* Continue Learning Section */}
          {myEnrollments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Play className="w-6 h-6 text-green-600" />
                Continue Learning ({myEnrollments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEnrollments.map((enrollment) => (
                  <motion.div
                    key={enrollment._id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
                    onClick={() => handleViewCourse(enrollment.courseId)}
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white opacity-50" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        {enrollment.courseName}
                      </h3>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{enrollment.overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.overallProgress}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCourse(enrollment.courseId);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Continue Learning
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Course Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEnroll={handleEnroll}
                  onViewCourse={handleViewCourse}
                  isStudent={true}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </DashboardLayout>
    );
  }

  // Course Detail View
  if (view === 'course-detail' && selectedCourse) {
    return (
      <DashboardLayout menuItems={EMPLOYEE_MENU} role={user?.role || 'student'}>
        <div className="min-h-screen">

        <div className="max-w-7xl mx-auto p-6">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleBackToBrowse}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  {selectedCourse.title}
                </h1>
                <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {selectedCourse.category}
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {selectedCourse.level}
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {selectedCourse.estimatedDuration}h estimated
                  </div>
                </div>

                {enrollment && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Your Progress</span>
                      <span className="font-semibold text-blue-600">
                        {enrollment.overallProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${enrollment.overallProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {enrollment?.completed && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateCertificate}
                    className="mt-6 w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
                  >
                    <Award className="w-5 h-5" />
                    {enrollment.certificateGenerated ? 'View Certificate' : 'Generate Certificate'}
                  </motion.button>
                )}
              </motion.div>

              {/* Video Player or Quiz */}
              {selectedVideo ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {selectedVideo.title}
                  </h2>
                  <VideoPlayer
                    videoUrl={selectedVideo.url}
                    videoId={selectedVideo._id}
                    onProgressUpdate={handleProgressUpdate}
                  />
                </motion.div>
              ) : showQuiz ? (
                <QuizComponent
                  quizzes={selectedCourse.quizzes}
                  onSubmit={handleQuizSubmit}
                  courseId={selectedCourse._id}
                  enrollmentId={enrollment?._id}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Select a video from the sidebar to start learning
                  </p>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Videos */}
              {selectedCourse.videos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-lg p-5"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Course Videos
                  </h3>
                  <div className="space-y-2">
                    {selectedCourse.videos.map((video, index) => {
                      const isWatched = enrollment?.videoProgress?.find(
                        vp => vp.videoId === video._id && vp.completed
                      );
                      
                      return (
                        <button
                          key={video._id}
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowQuiz(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            selectedVideo?._id === video._id
                              ? 'bg-blue-50 border-blue-500'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isWatched ? 'bg-green-500' : 'bg-gray-200'
                            }`}>
                              {isWatched ? (
                                <span className="text-white text-xs">✓</span>
                              ) : (
                                <span className="text-gray-600 text-xs">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {video.title}
                              </p>
                              {video.duration > 0 && (
                                <p className="text-xs text-gray-500">
                                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Resources */}
              {selectedCourse.resources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-5"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resources
                  </h3>
                  <div className="space-y-2">
                    {selectedCourse.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={`http://localhost:5000/${resource.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">
                              {resource.title}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                              {resource.type}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quiz */}
              {selectedCourse.quizzes.length > 0 && enrollment && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-5"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Course Quiz
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Test your knowledge with {selectedCourse.quizzes.length} questions
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowQuiz(true);
                      setSelectedVideo(null);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    {enrollment.quizAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                  </motion.button>
                  
                  {enrollment.quizAttempts.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Best Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.max(...enrollment.quizAttempts.map(a => 
                          Math.round((a.score / a.totalMarks) * 100)
                        ))}%
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {showCertificate && certificate && (
          <CertificateViewer
            certificate={certificate}
            onClose={() => setShowCertificate(false)}
          />
        )}
        </div>
      </DashboardLayout>
    );
  }

  return null;
};

export default CourseMaster;
