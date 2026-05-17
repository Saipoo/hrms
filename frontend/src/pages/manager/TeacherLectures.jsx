import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Video, 
  Upload, 
  FileText, 
  Users, 
  Clock, 
  Eye, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  Play,
  Edit,
  Trash2,
  BarChart3,
  VideoIcon
} from 'lucide-react';
import TeacherMeetingRoom from '../../components/meetings/TeacherMeetingRoom';
import PageHeader from '../../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TeacherLectures = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMeetingChoice, setShowMeetingChoice] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [inMeeting, setInMeeting] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: '',
    course: '',
    topic: '',
    difficulty: 'intermediate'
  });

  const [uploadForm, setUploadForm] = useState({
    video: null,
    audio: null
  });

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/lectures/teacher`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLectures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLecture = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/lectures/create`,
        createForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Lecture session created! Now upload your recording.');
        setSelectedLecture(response.data.data);
        setShowCreateModal(false);
        setShowMeetingChoice(true);
        fetchLectures();
      }
    } catch (error) {
      console.error('Error creating lecture:', error);
      alert('Failed to create lecture session');
    }
  };

  const startLiveMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/lectures/${selectedLecture._id}/start-meeting`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowMeetingChoice(false);
        setInMeeting(true);
        setSelectedLecture(response.data.data);
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Failed to start live meeting');
    }
  };

  const handleEndMeeting = async (recordingBlob) => {
    try {
      console.log('📤 handleEndMeeting called with blob:', recordingBlob?.size);
      
      const token = localStorage.getItem('token');
      
      // End the meeting
      console.log('📞 Ending meeting on server...');
      const endResponse = await axios.post(
        `${API_URL}/api/lectures/${selectedLecture._id}/end-meeting`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Meeting ended on server');

      if (endResponse.data.success && recordingBlob) {
        console.log('📹 Starting recording upload...');
        console.log('   - Blob size:', recordingBlob.size, 'bytes (', (recordingBlob.size / 1024 / 1024).toFixed(2), 'MB )');
        console.log('   - Blob type:', recordingBlob.type);
        
        // Upload the recording
        const formData = new FormData();
        formData.append('video', recordingBlob, `lecture-${selectedLecture._id}.webm`);

        console.log('📤 Uploading to server...');
        const uploadResponse = await axios.post(
          `${API_URL}/api/lectures/${selectedLecture._id}/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`   Upload progress: ${percentCompleted}%`);
            }
          }
        );

        console.log('✅ Upload complete!');
        console.log('   - Response:', uploadResponse.data);

        if (uploadResponse.data.success) {
          alert('✅ Meeting ended and recording saved! AI is processing your lecture...');
        }
      } else if (!recordingBlob) {
        console.warn('⚠️ No recording blob provided!');
        alert('✅ Meeting ended (no recording)');
      } else {
        alert('✅ Meeting ended successfully');
      }

      setInMeeting(false);
      setSelectedLecture(null);
      fetchLectures();
    } catch (error) {
      console.error('❌ Error ending meeting:', error);
      console.error('   - Error details:', error.response?.data || error.message);
      alert('Meeting ended but there was an error saving the recording');
      setInMeeting(false);
      setSelectedLecture(null);
    }
  };

  const chooseUploadOption = () => {
    setShowMeetingChoice(false);
    setShowUploadModal(true);
  };

  const uploadRecording = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.video && !uploadForm.audio) {
      alert('Please select at least a video or audio file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (uploadForm.video) formData.append('video', uploadForm.video);
      if (uploadForm.audio) formData.append('audio', uploadForm.audio);

      const response = await axios.post(
        `${API_URL}/api/lectures/${selectedLecture._id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('✅ Recording uploaded! AI is processing your lecture...');
        setShowUploadModal(false);
        setUploadForm({ video: null, audio: null });
        fetchLectures();
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      alert('Failed to upload recording');
    }
  };

  const publishLecture = async (lectureId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/lectures/${lectureId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Lecture published successfully!');
        fetchLectures();
      }
    } catch (error) {
      console.error('Error publishing lecture:', error);
      alert(error.response?.data?.message || 'Failed to publish lecture');
    }
  };

  const deleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/lectures/${lectureId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Lecture deleted successfully');
      fetchLectures();
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('Failed to delete lecture');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      recording: { color: 'bg-blue-100 text-blue-700', icon: Video, text: 'Recording' },
      processing: { color: 'bg-yellow-100 text-yellow-700', icon: Loader, text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Completed' },
      published: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle, text: 'Published' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.recording;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Manager Documents & Policies" 
        subtitle="Record, transcribe, and manage AI-powered training videos" 
        icon={Video} 
      />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end mb-6 mt-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Video className="w-5 h-5" />
              New Training Session
            </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lectures</p>
                <p className="text-2xl font-bold text-gray-900">{lectures.length}</p>
              </div>
              <Video className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {lectures.filter(l => l.isPublished).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lectures.filter(l => l.processingStatus === 'processing').length}
                </p>
              </div>
              <Loader className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lectures.reduce((sum, l) => sum + (l.studentsWatched?.length || 0), 0)}
                </p>
              </div>
              <Eye className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Lectures List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Lectures</h2>
          </div>

          <div className="divide-y">
            {lectures.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No lectures yet</p>
                <p className="text-sm">Create your first lecture to get started</p>
              </div>
            ) : (
              lectures.map((lecture) => (
                <div key={lecture._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lecture.title}
                        </h3>
                        {getStatusBadge(lecture.processingStatus)}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {lecture.subject}
                        </span>
                        {lecture.topic && (
                          <span>📚 {lecture.topic}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lecture.duration || 0} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {lecture.enrolledStudents?.length || 0} students
                        </span>
                      </div>

                      {lecture.engagementStats && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            👁️ {lecture.engagementStats.totalWatched} views
                          </span>
                          <span className="text-gray-600">
                            📥 {lecture.engagementStats.totalDownloads} downloads
                          </span>
                          <span className="text-green-600 font-medium">
                            {lecture.engagementStats.averageCompletion}% avg completion
                          </span>
                        </div>
                      )}

                      {lecture.processingStatus === 'failed' && (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Error: {lecture.processingError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {lecture.processingStatus === 'completed' && !lecture.isPublished && (
                        <button
                          onClick={() => publishLecture(lecture._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          Publish
                        </button>
                      )}

                      {lecture.processingStatus === 'recording' && (
                        <button
                          onClick={() => {
                            setSelectedLecture(lecture);
                            setShowUploadModal(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-1"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                      )}

                      <button
                        onClick={() => deleteLecture(lecture._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Lecture Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create New Lecture</h2>
            </div>

            <form onSubmit={createLecture} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to Data Structures"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <input
                    type="text"
                    value={createForm.course}
                    onChange={(e) => setCreateForm({ ...createForm, course: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., CS101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  value={createForm.topic}
                  onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Arrays and Linked Lists"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create & Upload Recording
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Recording Modal */}
      {showUploadModal && selectedLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Upload Recording</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedLecture.title}</p>
            </div>

            <form onSubmit={uploadRecording} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File (MP4, AVI, MOV, MKV, WEBM)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setUploadForm({ ...uploadForm, video: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {uploadForm.video && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {uploadForm.video.name} ({(uploadForm.video.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio File (Optional - MP3, WAV, M4A)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadForm({ ...uploadForm, audio: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {uploadForm.audio && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {uploadForm.audio.name}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After uploading, AI will automatically:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>Transcribe the entire lecture</li>
                  <li>Generate short summary notes</li>
                  <li>Extract key points and concepts</li>
                  <li>Create revision questions</li>
                  <li>Generate flashcards for students</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ video: null, audio: null });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.video && !uploadForm.audio}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload & Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Choice Modal */}
      {showMeetingChoice && selectedLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose How to Add Content</h2>
              <p className="text-gray-600">For: {selectedLecture.title}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Live Meeting */}
              <button
                onClick={startLiveMeeting}
                className="group p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition">
                    <VideoIcon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Start Live Meeting</h3>
                  <p className="text-sm text-gray-600">
                    Start a live video lecture session with real-time recording, screen sharing, and student interaction
                  </p>
                  <div className="mt-4 text-xs text-indigo-600 font-medium">
                    ✓ Real-time recording<br />
                    ✓ Screen sharing<br />
                    ✓ Student chat<br />
                    ✓ Auto AI processing
                  </div>
                </div>
              </button>

              {/* Upload Pre-recorded */}
              <button
                onClick={chooseUploadOption}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Upload Recording</h3>
                  <p className="text-sm text-gray-600">
                    Upload a pre-recorded video or audio file for AI processing and student access
                  </p>
                  <div className="mt-4 text-xs text-gray-600 font-medium">
                    ✓ Video/Audio upload<br />
                    ✓ Up to 500MB<br />
                    ✓ Multiple formats<br />
                    ✓ AI processing
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowMeetingChoice(false);
                  setSelectedLecture(null);
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Room */}
      {inMeeting && selectedLecture && (
        <TeacherMeetingRoom
          lecture={selectedLecture}
          onEndMeeting={handleEndMeeting}
        />
      )}
    </div>
  );
};

export default TeacherLectures;

