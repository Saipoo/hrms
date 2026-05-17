import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Video, 
  FileText, 
  Download, 
  Play,
  BookOpen,
  Brain,
  Lightbulb,
  Clock,
  User,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Circle,
  Users
} from 'lucide-react';
import StudentMeetingRoom from '../../components/meetings/StudentMeetingRoom';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EmployeeLectures = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [liveLectures, setLiveLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('lectures'); // lectures, revision, live
  const [revisionData, setRevisionData] = useState(null);
  const [inMeeting, setInMeeting] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchLectures();
    fetchLiveLectures();
    fetchEmployeeInfo();
    
    // Poll for live lectures every 30 seconds
    const interval = setInterval(fetchLiveLectures, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployeeInfo = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setStudentInfo({
      empid: user.empid,
      name: user.name,
      email: user.email
    });
  };

  const fetchLiveLectures = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/lectures/live`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLiveLectures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching live lectures:', error);
    }
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/lectures/employee`,
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

  const fetchRevisionMode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/lectures/employee/revision-mode`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRevisionData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching revision data:', error);
    }
  };

  const joinMeeting = async (lecture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/lectures/${lecture._id}/join-meeting`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSelectedLecture(response.data.data);
        setInMeeting(true);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      alert(error.response?.data?.message || 'Failed to join meeting');
    }
  };

  const handleLeaveMeeting = () => {
    setInMeeting(false);
    setSelectedLecture(null);
    fetchLiveLectures();
    fetchLectures();
  };

  const viewNotes = async (lecture) => {
    setSelectedLecture(lecture);
    setShowNotesModal(true);

    // Track view
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/lectures/${lecture._id}/track-watch`,
        { watchDuration: 0, completionPercentage: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const downloadNotes = async (lecture) => {
    try {
      const token = localStorage.getItem('token');
      
      // Track download
      await axios.post(
        `${API_URL}/api/lectures/${lecture._id}/track-download`,
        { itemType: 'notes' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create downloadable text file
      const content = `
${lecture.title}
${lecture.subject} - ${lecture.topic || ''}
Manager: ${lecture.teacherName}
Date: ${new Date(lecture.publishedAt).toLocaleDateString()}

========================================
SHORT SUMMARY
========================================

${lecture.shortSummary || 'No summary available'}

========================================
DETAILED NOTES
========================================

${lecture.detailedNotes || 'No detailed notes available'}

========================================
KEY POINTS
========================================

${lecture.keyPoints?.map((kp, idx) => `
${idx + 1}. ${kp.title}
   ${kp.description}
   Category: ${kp.category}
`).join('\n') || 'No key points available'}

========================================
REVISION QUESTIONS
========================================

${lecture.revisionQuestions?.map((q, idx) => `
${idx + 1}. ${q.question}
   Type: ${q.type}
`).join('\n') || 'No questions available'}
      `;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lecture.title.replace(/[^a-z0-9]/gi, '_')}_notes.txt`;
      a.click();
      URL.revokeObjectURL(url);

      alert('✅ Notes downloaded!');
    } catch (error) {
      console.error('Error downloading notes:', error);
      alert('Failed to download notes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Company Policies"
    >
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'live'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Circle className={`w-3 h-3 ${liveLectures.length > 0 ? 'fill-red-500 animate-pulse' : ''}`} />
                Live Now ({liveLectures.length})
              </div>
            </button>

            <button
              onClick={() => setActiveTab('lectures')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'lectures'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Video className="w-5 h-5" />
                All Company Documents ({lectures.length})
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('revision');
                fetchRevisionMode();
              }}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'revision'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5" />
                Revision Mode
              </div>
            </button>
          </div>
        </div>

        {/* Live Meetings Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {liveLectures.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Live Lectures</p>
                <p className="text-sm">There are no live lectures happening right now</p>
              </div>
            ) : (
              liveLectures.map((lecture) => (
                <div key={lecture._id} className="bg-white rounded-lg shadow-sm border-2 border-red-200 hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Circle className="w-2 h-2 fill-red-600 animate-pulse" />
                            LIVE NOW
                          </span>
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                            {lecture.subject}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {lecture.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {lecture.teacherName}
                          </span>
                          {lecture.topic && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {lecture.topic}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {lecture.currentParticipants?.length || 0} participants
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Started {new Date(lecture.meetingStartTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => joinMeeting(lecture)}
                        className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-medium"
                      >
                        <Play className="w-5 h-5" />
                        Join Meeting
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lectures Tab */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            {lectures.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No documents available yet</p>
                <p className="text-sm">Your managers will publish company documents here</p>
              </div>
            ) : (
              lectures.map((lecture) => (
                <div key={lecture._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🎓</span>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {lecture.title}
                          </h3>
                          <p className="text-sm text-gray-600">{lecture.subject}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {lecture.teacherName}
                        </span>
                        {lecture.topic && (
                          <span>📚 {lecture.topic}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lecture.duration} mins
                        </span>
                        <span className="text-gray-500">
                          {new Date(lecture.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {lecture.shortSummary && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {lecture.shortSummary}
                        </p>
                      )}

                      {lecture.keyPoints && lecture.keyPoints.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {lecture.keyPoints.slice(0, 3).map((kp, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                            >
                              {kp.title}
                            </span>
                          ))}
                          {lecture.keyPoints.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{lecture.keyPoints.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => viewNotes(lecture)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2 whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4" />
                        View Notes
                      </button>

                      <button
                        onClick={() => downloadNotes(lecture)}
                        className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Revision Mode Tab */}
        {activeTab === 'revision' && (
          <div className="space-y-6">
            {!revisionData ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading revision materials...</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Documents</p>
                        <p className="text-3xl font-bold text-indigo-600">{revisionData.totalLectures}</p>
                      </div>
                      <Video className="w-10 h-10 text-indigo-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Flashcards</p>
                        <p className="text-3xl font-bold text-green-600">{revisionData.flashcards?.length || 0}</p>
                      </div>
                      <Brain className="w-10 h-10 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Key Points</p>
                        <p className="text-3xl font-bold text-yellow-600">{revisionData.keyPoints?.length || 0}</p>
                      </div>
                      <Lightbulb className="w-10 h-10 text-yellow-600" />
                    </div>
                  </div>
                </div>

                {/* Flashcards */}
                {revisionData.flashcards && revisionData.flashcards.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-green-600" />
                      Flashcards for Quick Revision
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {revisionData.flashcards.slice(0, 12).map((card, idx) => (
                        <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="text-sm font-medium text-indigo-600 mb-2">{card.topic}</div>
                          <div className="text-gray-900 font-semibold mb-2">{card.question}</div>
                          <div className="text-sm text-gray-600">{card.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {revisionData.keyPoints && revisionData.keyPoints.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-yellow-600" />
                      Consolidated Key Points
                    </h2>
                    <div className="space-y-3">
                      {revisionData.keyPoints.slice(0, 10).map((kp, idx) => (
                        <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2">
                          <div className="font-semibold text-gray-900">{kp.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{kp.description}</div>
                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            {kp.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision Questions */}
                {revisionData.revisionQuestions && revisionData.revisionQuestions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-blue-600" />
                      Practice Questions
                    </h2>
                    <div className="space-y-3">
                      {revisionData.revisionQuestions.slice(0, 10).map((q, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900">{q.question}</p>
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {q.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedLecture.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLecture.subject} • {selectedLecture.teacherName}
                </p>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Short Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Summary
                </h3>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedLecture.shortSummary || 'No summary available'}
                  </p>
                </div>
              </div>

              {/* Detailed Notes */}
              {selectedLecture.detailedNotes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Detailed Notes
                  </h3>
                  <div className="prose max-w-none bg-white border border-gray-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedLecture.detailedNotes}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Points */}
              {selectedLecture.keyPoints && selectedLecture.keyPoints.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Key Points
                  </h3>
                  <div className="space-y-3">
                    {selectedLecture.keyPoints.map((kp, idx) => (
                      <div key={idx} className="border-l-4 border-yellow-500 bg-yellow-50 pl-4 py-3 rounded">
                        <div className="font-semibold text-gray-900">{kp.title}</div>
                        <p className="text-sm text-gray-700 mt-1">{kp.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                          {kp.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revision Questions */}
              {selectedLecture.revisionQuestions && selectedLecture.revisionQuestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Revision Questions
                  </h3>
                  <div className="space-y-2">
                    {selectedLecture.revisionQuestions.map((q, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-900">{q.question}</p>
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {q.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => downloadNotes(selectedLecture)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Room */}
      {inMeeting && selectedLecture && studentInfo && (
        <EmployeeMeetingRoom
          lecture={selectedLecture}
          studentInfo={studentInfo}
          onLeaveMeeting={handleLeaveMeeting}
        />
      )}
    </div>
    </DashboardLayout>
  );
};

export default EmployeeLectures;
