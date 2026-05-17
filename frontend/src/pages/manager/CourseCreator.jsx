import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Plus, BookOpen, Video, FileText, HelpCircle, Eye, EyeOff, 
  Edit, Trash2, Upload, Users, Award, Save, X
} from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import PageHeader from '../../components/PageHeader';

const CourseCreator = () => {
  const [courses, setCourses] = useState([]);
  const [view, setView] = useState('list'); // list, create, edit, manage
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    estimatedDuration: 0,
    thumbnailUrl: ''
  });

  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // Add Video/Resource Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState(''); // video, resource, quiz

  const categories = [
    'Programming', 'Data Science', 'Web Development', 'Mobile Development',
    'Machine Learning', 'Artificial Intelligence', 'Database', 'Networking',
    'Cybersecurity', 'Cloud Computing', 'DevOps', 'Other'
  ];

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses/teacher/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/courses/create',
        courseForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedCourse(response.data.course);
      alert('Course created successfully!');
      setView('edit');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course');
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/courses/update/${selectedCourse._id}`,
        courseForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Course updated successfully!');
      fetchMyCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Error updating course');
    }
  };

  const handleAddVideo = async (videoData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/courses/${selectedCourse._id}/video`,
        videoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Video added successfully!');
      // Refresh course data
      const response = await axios.get(`http://localhost:5000/api/courses/${selectedCourse._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCourse(response.data.course);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error adding video');
    }
  };

  const handleAddResource = async (resourceData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/courses/${selectedCourse._id}/resource`,
        resourceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Resource added successfully!');
      const response = await axios.get(`http://localhost:5000/api/courses/${selectedCourse._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCourse(response.data.course);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Error adding resource');
    }
  };

  const handleAddQuiz = async (quizData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/courses/${selectedCourse._id}/quiz`,
        quizData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Quiz question added successfully!');
      const response = await axios.get(`http://localhost:5000/api/courses/${selectedCourse._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCourse(response.data.course);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding quiz:', error);
      alert('Error adding quiz');
    }
  };

  const handlePublishToggle = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/courses/publish/${courseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchMyCourses();
    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Error publishing course');
    }
  };

  const handleFileUpload = async (file, type) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append(type, file);
      
      const response = await axios.post(
        `http://localhost:5000/api/courses/upload/${type}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // List View
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <PageHeader 
          title="Training Program Creator" 
          subtitle="Create and manage your training programs" 
          icon={BookOpen} 
        />
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Actions */}
          <div className="flex justify-end items-center mb-8 mt-4">
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setView('create');
                  setCourseForm({
                    title: '',
                    description: '',
                    category: 'Programming',
                    level: 'Beginner',
                    estimatedDuration: 0,
                    thumbnailUrl: ''
                  });
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Create New Program
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/dashboard/teacher/course-dashboard'}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                View Dashboard
              </motion.button>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No programs created yet</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setView('create')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-lg font-semibold"
              >
                Create Your First Program
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course._id} className="relative">
                  <CourseCard
                    course={course}
                    onViewCourse={(id) => {
                      const selected = courses.find(c => c._id === id);
                      setSelectedCourse(selected);
                      setCourseForm({
                        title: selected.title,
                        description: selected.description,
                        category: selected.category,
                        level: selected.level,
                        estimatedDuration: selected.estimatedDuration,
                        thumbnailUrl: selected.thumbnailUrl
                      });
                      setView('edit');
                    }}
                    isStudent={false}
                  />
                  
                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handlePublishToggle(course._id)}
                      className={`p-2 rounded-lg ${
                        course.published 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      } backdrop-blur-sm`}
                      title={course.published ? 'Published' : 'Unpublished'}
                    >
                      {course.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create/Edit View
  if (view === 'create' || view === 'edit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <PageHeader 
          title={view === 'create' ? 'Create New Training Program' : 'Edit Training Program'} 
          subtitle="Manage program details and curriculum" 
          icon={BookOpen} 
        />
        <div className="max-w-5xl mx-auto p-6">
          {/* Header Actions */}
          <div className="mb-8 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setView('list');
                fetchMyCourses();
              }}
              className="mb-4 text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2"
            >
              ← Back to Training Programs
            </motion.button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Program Title *
              </label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                placeholder="e.g., Complete Python Programming"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Description *
              </label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Describe what students will learn..."
                rows="4"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Category *
                </label>
                <select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Level *
                </label>
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({...courseForm, level: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={courseForm.estimatedDuration}
                  onChange={(e) => setCourseForm({...courseForm, estimatedDuration: parseInt(e.target.value)})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Thumbnail Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const url = await handleFileUpload(file, 'thumbnail');
                      setCourseForm({...courseForm, thumbnailUrl: url});
                      alert('Thumbnail uploaded!');
                    } catch (error) {
                      alert('Error uploading thumbnail');
                    }
                  }
                }}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              {courseForm.thumbnailUrl && (
                <img 
                  src={`http://localhost:5000/${courseForm.thumbnailUrl}`} 
                  alt="Thumbnail" 
                  className="mt-2 h-32 rounded-lg"
                />
              )}
            </div>

            <div className="flex gap-4">
              {view === 'create' ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateCourse}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Create Program
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateCourse}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handlePublishToggle(selectedCourse._id)}
                    className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                      selectedCourse.published 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {selectedCourse.published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {selectedCourse.published ? 'Unpublish' : 'Publish'}
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Content Management (only in edit mode) */}
          {view === 'edit' && selectedCourse && (
            <div className="mt-6 space-y-6">
              {/* Videos */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Video className="w-6 h-6" />
                    Videos ({selectedCourse.videos?.length || 0})
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setModalType('video');
                      setShowAddModal(true);
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Video
                  </motion.button>
                </div>
                
                <div className="space-y-2">
                  {selectedCourse.videos?.map((video, index) => (
                    <div key={video._id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{index + 1}. {video.title}</p>
                        <p className="text-sm text-gray-600">{video.duration}s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Resources ({selectedCourse.resources?.length || 0})
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setModalType('resource');
                      setShowAddModal(true);
                    }}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Resource
                  </motion.button>
                </div>
                
                <div className="space-y-2">
                  {selectedCourse.resources?.map((resource, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{resource.title}</p>
                        <p className="text-sm text-gray-600">{resource.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quizzes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6" />
                    Quiz Questions ({selectedCourse.quizzes?.length || 0})
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setModalType('quiz');
                      setShowAddModal(true);
                    }}
                    className="bg-purple-500 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </motion.button>
                </div>
                
                <div className="space-y-2">
                  {selectedCourse.quizzes?.map((quiz, index) => (
                    <div key={quiz._id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold">{index + 1}. {quiz.question}</p>
                      <p className="text-sm text-gray-600">{quiz.marks} marks</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && <AddContentModal 
          type={modalType}
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => {
            if (modalType === 'video') handleAddVideo(data);
            else if (modalType === 'resource') handleAddResource(data);
            else if (modalType === 'quiz') handleAddQuiz(data);
          }}
          onUpload={handleFileUpload}
        />}
      </div>
    );
  }

  return null;
};

// Add Content Modal Component
const AddContentModal = ({ type, onClose, onAdd, onUpload }) => {
  const [formData, setFormData] = useState(
    type === 'resource' ? { type: 'pdf' } : 
    type === 'quiz' ? { type: 'multiple-choice', options: [] } : 
    {}
  );
  const [uploading, setUploading] = useState(false);

  const handleSubmit = () => {
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {type === 'video' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Video Title"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
            />
            <input
              type="file"
              accept="video/*"
              onChange={async (e) => {
                setUploading(true);
                const url = await onUpload(e.target.files[0], 'video');
                setFormData({...formData, url});
                setUploading(false);
              }}
              className="w-full p-3 border-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Duration (seconds)"
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full p-3 border-2 rounded-lg"
            />
          </div>
        )}

        {type === 'resource' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Resource Title"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
            />
            <select
              defaultValue="pdf"
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
            >
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="ppt">PPT</option>
              <option value="link">Link</option>
            </select>
            <input
              type="file"
              onChange={async (e) => {
                setUploading(true);
                const url = await onUpload(e.target.files[0], 'resource');
                setFormData({...formData, url});
                setUploading(false);
              }}
              className="w-full p-3 border-2 rounded-lg"
            />
          </div>
        )}

        {type === 'quiz' && (
          <div className="space-y-4">
            <textarea
              placeholder="Question"
              onChange={(e) => setFormData({...formData, question: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
              rows="3"
            />
            <select
              defaultValue="multiple-choice"
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="short-answer">Short Answer</option>
            </select>
            {formData.type === 'multiple-choice' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Option 1"
                  onChange={(e) => {
                    const options = formData.options || [];
                    options[0] = e.target.value;
                    setFormData({...formData, options});
                  }}
                  className="w-full p-2 border-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Option 2"
                  onChange={(e) => {
                    const options = formData.options || [];
                    options[1] = e.target.value;
                    setFormData({...formData, options});
                  }}
                  className="w-full p-2 border-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Option 3"
                  onChange={(e) => {
                    const options = formData.options || [];
                    options[2] = e.target.value;
                    setFormData({...formData, options});
                  }}
                  className="w-full p-2 border-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Option 4"
                  onChange={(e) => {
                    const options = formData.options || [];
                    options[3] = e.target.value;
                    setFormData({...formData, options});
                  }}
                  className="w-full p-2 border-2 rounded-lg"
                />
              </div>
            )}
            <input
              type="text"
              placeholder="Correct Answer"
              onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
              className="w-full p-3 border-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Marks"
              onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value)})}
              className="w-full p-3 border-2 rounded-lg"
            />
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Add'}
          </motion.button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 rounded-lg font-semibold"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseCreator;
