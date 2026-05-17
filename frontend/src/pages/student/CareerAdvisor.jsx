import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Briefcase,
  Target,
  TrendingUp,
  FileText,
  Users,
  Award,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Send,
  X
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const CareerAdvisor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyzing, setAnalyzing] = useState(false);
  
  // AI Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/api/career/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      
      // If no profile exists, create one
      if (error.response?.status === 404) {
        await createInitialProfile();
      }
    } finally {
      setLoading(false);
    }
  };

  const createInitialProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/career/profile`,
        {
          interests: [],
          preferences: {}
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch dashboard again
      fetchDashboard();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const analyzeCareerPaths = async () => {
    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/career/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✨ Career paths analyzed successfully!');
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error analyzing career paths:', error);
      alert('Failed to analyze career paths');
    } finally {
      setAnalyzing(false);
    }
  };

  const chooseCareerPath = async (pathTitle) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/career/choose-path`,
        { pathTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Career path chosen successfully!');
      fetchDashboard();
    } catch (error) {
      console.error('Error choosing career path:', error);
      alert(error.response?.data?.message || 'Failed to choose career path');
    }
  };

  const generateResume = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/career/generate-resume`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✨ Resume generated successfully!');
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume');
    }
  };

  const syncData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/career/sync-data`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Data synced successfully!');
      fetchDashboard();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  // AI Chat functions
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    
    // Add user message to chat
    const newHistory = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(newHistory);

    try {
      setChatLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/career/chat`,
        { 
          message: userMessage,
          chatHistory: newHistory
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setChatHistory([
          ...newHistory,
          { role: 'assistant', content: response.data.data.message }
        ]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      alert('Failed to send message. Please try again.');
      // Remove user message if failed
      setChatHistory(chatHistory);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const suggestedQuestions = [
    "What career path is best for me?",
    "How can I improve my career readiness?",
    "What skills should I focus on learning?",
    "How do I prepare for job interviews?",
    "What companies hire for my chosen path?"
  ];

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getImportanceColor = (importance) => {
    const colors = {
      required: 'text-red-600 bg-red-50 border-red-200',
      recommended: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      optional: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[importance] || colors.optional;
  };

  const formatSalary = (salaryData) => {
    if (!salaryData) return 'Not specified';
    
    // If it's already a string, return it
    if (typeof salaryData === 'string') return salaryData;
    
    // If it's an object with min/max
    if (salaryData.min && salaryData.max) {
      const currency = salaryData.currency || 'INR';
      return `${currency} ${salaryData.min?.toLocaleString()} - ${salaryData.max?.toLocaleString()}`;
    }
    
    // If it's an object with just currency
    if (salaryData.currency) {
      return salaryData.currency;
    }
    
    return 'Not specified';
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
        
        {/* Floating AI Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50"
          title="Chat with WorkSphere HR Growth Advisor"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* AI Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-lg">HR Growth Advisor</h3>
                    <p className="text-xs text-indigo-100">Get personalized career guidance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white hover:bg-indigo-700 p-2 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Ask me anything about your career!</p>
                    
                    {/* Suggested Questions */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 mb-2">Try these questions:</p>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setChatMessage(question);
                            setTimeout(() => sendChatMessage(), 100);
                          }}
                          className="block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load career advisor</p>
          </div>
        </div>
        
        {/* Floating AI Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50"
          title="Chat with WorkSphere HR Growth Advisor"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* AI Chat Modal - Same as above */}
        {showChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-lg">HR Growth Advisor</h3>
                    <p className="text-xs text-indigo-100">Get personalized career guidance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white hover:bg-indigo-700 p-2 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Ask me anything about your career!</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 mb-2">Try these questions:</p>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setChatMessage(question);
                            setTimeout(() => sendChatMessage(), 100);
                          }}
                          className="block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const { 
    profile = { chosenPaths: [], currentSkills: [], interests: [] }, 
    topRecommendations = [], 
    criticalSkillGaps = [], 
    readinessScore = null, 
    activeGoals = [] 
  } = dashboardData || {};

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Career Growth AI"
    >
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              Your personalized career dashboard
            </div>
            
            <div className="flex items-center gap-4">
              {readinessScore && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {readinessScore?.overall || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Career Ready</div>
                </div>
              )}
              
              <button
                onClick={analyzeCareerPaths}
                disabled={analyzing}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {analyzing ? 'Analyzing...' : 'Analyze Paths'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chosen Paths</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.chosenPaths?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Career directions</p>
              </div>
              <Target className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Skill Gaps</p>
                <p className="text-2xl font-bold text-orange-600">
                  {criticalSkillGaps?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Critical skills needed</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Skills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.currentSkills?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Skills acquired</p>
              </div>
              <Award className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeGoals?.length || 0}
                </p>
                <p className="text-xs text-gray-500">In progress</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex gap-4 px-6">
              {['overview', 'paths', 'skills', 'resume'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 border-b-2 font-medium transition capitalize ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={analyzeCareerPaths}
                    className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                  >
                    <Lightbulb className="w-6 h-6 text-indigo-600" />
                    <div className="text-left">
                      <div className="font-semibold text-indigo-900">Analyze Career</div>
                      <div className="text-sm text-indigo-600">Get AI recommendations</div>
                    </div>
                  </button>

                  <button
                    onClick={generateResume}
                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                  >
                    <FileText className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold text-green-900">Generate Resume</div>
                      <div className="text-sm text-green-600">AI-powered ATS resume</div>
                    </div>
                  </button>

                  <button
                    onClick={syncData}
                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  >
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-blue-900">Sync Data</div>
                      <div className="text-sm text-blue-600">Update from modules</div>
                    </div>
                  </button>
                </div>

                {/* Readiness Score */}
                {readinessScore && (
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      Career Readiness Score
                    </h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall</span>
                        <span className="text-2xl font-bold text-indigo-600">{readinessScore.overall}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all"
                          style={{ width: `${readinessScore.overall}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Technical Skills</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${readinessScore?.breakdown?.technical || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{readinessScore?.breakdown?.technical || 0}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Soft Skills</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${readinessScore?.breakdown?.softSkills || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{readinessScore?.breakdown?.softSkills || 0}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Experience</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${readinessScore?.breakdown?.experience || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{readinessScore?.breakdown?.experience || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {readinessScore?.strengths && readinessScore.strengths.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-green-700 mb-2">✅ Strengths:</div>
                        <ul className="space-y-1">
                          {readinessScore.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {readinessScore?.areasToImprove && readinessScore.areasToImprove.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-orange-700 mb-2">📈 Areas to Improve:</div>
                        <ul className="space-y-1">
                          {readinessScore.areasToImprove.map((area, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Top Recommendations */}
                {topRecommendations && topRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Top Career Recommendations
                    </h3>
                    <div className="space-y-3">
                      {topRecommendations.map((path, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${getMatchColor(path.matchScore)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">💼</span>
                                <div>
                                  <div className="font-semibold text-lg">{path.title}</div>
                                  <div className="text-sm opacity-75">{path.description}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <span className="font-semibold">Match: {path.matchScore}%</span>
                                <span>💰 {formatSalary(path.salaryRange || path.averageSalary)}</span>
                              </div>

                              {path.requiredSkills && path.requiredSkills.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-xs font-medium mb-1">Required Skills:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {path.requiredSkills.slice(0, 5).map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-white bg-opacity-50 text-xs rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => chooseCareerPath(path.title)}
                              className="ml-4 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-20 transition text-sm font-medium"
                            >
                              Choose Path
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Skill Gaps */}
                {criticalSkillGaps && criticalSkillGaps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Critical Skill Gaps
                    </h3>
                    <div className="space-y-2">
                      {criticalSkillGaps.map((gap, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${getImportanceColor(gap.importance)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold">{gap.skill}</div>
                              <div className="text-sm mt-1">
                                Current: {gap.currentLevel || 'None'} → Target: {gap.requiredLevel}
                              </div>
                              <div className="text-sm mt-2">
                                ⏱️ Est. Time: {gap.estimatedTime}
                              </div>
                            </div>
                            
                            <span className="px-2 py-1 text-xs font-medium rounded bg-white bg-opacity-50">
                              {gap.importance}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paths Tab */}
            {activeTab === 'paths' && (
              <div className="space-y-4">
                {profile.chosenPaths && profile.chosenPaths.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Chosen Career Paths</h3>
                    <div className="space-y-3">
                      {profile.chosenPaths.map((path, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-indigo-50">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">🎯</span>
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-indigo-900">{path.title}</div>
                              <div className="text-gray-700 mt-1">{path.description}</div>
                              <div className="mt-3 text-sm text-gray-600">
                                Target Date: {new Date(path.targetDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No career paths chosen yet</p>
                    <button
                      onClick={analyzeCareerPaths}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Analyze Career Paths
                    </button>
                  </div>
                )}

                {profile.recommendedPaths && profile.recommendedPaths.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">All Recommendations</h3>
                    <div className="space-y-3">
                      {profile.recommendedPaths.map((rec, index) => {
                        // Handle nested structure: { path: {...}, matchScore, reasoning }
                        const pathData = rec.path || rec;
                        const matchScore = rec.matchScore || pathData.matchScore;
                        
                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold">{pathData.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{pathData.description}</div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-indigo-600 font-medium">
                                    Match: {matchScore}%
                                  </span>
                                  <span className="text-gray-600">
                                    💰 {formatSalary(pathData.salaryRange || pathData.averageSalary)}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => chooseCareerPath(pathData.title)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                              >
                                Choose
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Current Skills</h3>
                  {profile.currentSkills && profile.currentSkills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.currentSkills.map((skill, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-green-900">{skill.name}</div>
                              <div className="text-sm text-green-700 capitalize">{skill.level}</div>
                            </div>
                            <Award className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No skills recorded yet</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skill Gaps to Address</h3>
                  {profile.skillGaps && profile.skillGaps.length > 0 ? (
                    <div className="space-y-3">
                      {profile.skillGaps.map((gap, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${getImportanceColor(gap.importance)}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-semibold">{gap.skill}</div>
                              <div className="text-sm mt-1">
                                Current: {gap.currentLevel || 'None'} → Target: {gap.requiredLevel}
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded bg-white">
                              {gap.importance}
                            </span>
                          </div>

                          {gap.progress !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{gap.progress}%</span>
                              </div>
                              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                                <div
                                  className="bg-current h-2 rounded-full transition-all"
                                  style={{ width: `${gap.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {gap.resources && gap.resources.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-2">📚 Learning Resources:</div>
                              <div className="space-y-2">
                                {gap.resources.slice(0, 2).map((resource, idx) => (
                                  <div key={idx} className="text-sm bg-white bg-opacity-50 p-2 rounded">
                                    <div className="font-medium">{resource.title}</div>
                                    <div className="text-xs opacity-75">{resource.type}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No skill gaps identified yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div>
                {profile.resume && profile.resume.summary ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Your AI-Generated Resume</h3>
                      <button
                        onClick={generateResume}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        Regenerate
                      </button>
                    </div>

                    <div className="border rounded-lg p-6 bg-white">
                      {/* Summary */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Professional Summary</h4>
                        <p className="text-gray-700">{profile.resume.summary}</p>
                      </div>

                      {/* Education */}
                      {profile.resume.education && profile.resume.education.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                          {profile.resume.education.map((edu, index) => (
                            <div key={index} className="mb-3">
                              <div className="font-medium">{edu.degree}</div>
                              <div className="text-sm text-gray-600">{edu.institution}</div>
                              <div className="text-sm text-gray-500">{edu.year}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Experience */}
                      {profile.resume.experience && profile.resume.experience.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                          {profile.resume.experience.map((exp, index) => (
                            <div key={index} className="mb-3">
                              <div className="font-medium">{exp.title}</div>
                              <div className="text-sm text-gray-600">{exp.company}</div>
                              <div className="text-sm text-gray-500">{exp.duration}</div>
                              <ul className="mt-2 space-y-1">
                                {exp.achievements && exp.achievements.map((achievement, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span>•</span>
                                    <span>{achievement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skills */}
                      {profile.resume.skills && profile.resume.skills.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.resume.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-6">
                        Last generated: {new Date(profile.resume.lastGenerated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No resume generated yet</p>
                    <button
                      onClick={generateResume}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Generate AI Resume
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-40"
        title="Chat with WorkSphere HR Growth Advisor"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg">AI Career Advisor</h3>
                  <p className="text-xs text-indigo-100">Get personalized career guidance</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white hover:bg-indigo-700 p-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Ask me anything about your career!</p>
                  
                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-2">Try these questions:</p>
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatMessage(question);
                          setTimeout(() => sendChatMessage(), 100);
                        }}
                        className="block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-gray-50 rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default CareerAdvisor;
