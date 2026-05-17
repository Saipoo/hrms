import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Code
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';

const LiveInterviewSession = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(location.state?.questions || null);
  const [duration, setDuration] = useState(location.state?.duration || 30);
  const [currentSection, setCurrentSection] = useState('personal'); // personal, technical, coding
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    initializeCamera();
    startTimer();

    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleCompleteInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentQuestion = () => {
    if (!questions) return null;
    
    switch (currentSection) {
      case 'personal':
        return questions.personal[currentIndex];
      case 'technical':
        return questions.technical[currentIndex];
      case 'coding':
        return questions.coding[currentIndex];
      default:
        return null;
    }
  };

  const getTotalQuestions = () => {
    if (!questions) return 0;
    return questions.personal.length + questions.technical.length + questions.coding.length;
  };

  const getCurrentQuestionNumber = () => {
    if (!questions) return 0;
    let total = 0;
    if (currentSection === 'personal') {
      total = currentIndex + 1;
    } else if (currentSection === 'technical') {
      total = questions.personal.length + currentIndex + 1;
    } else {
      total = questions.personal.length + questions.technical.length + currentIndex + 1;
    }
    return total;
  };

  const handleNext = async () => {
    // Save current answer
    const questionKey = `${currentSection}-${currentIndex}`;
    setAnswers({
      ...answers,
      [questionKey]: {
        answer: currentAnswer,
        code: currentCode
      }
    });

    // Submit to backend
    try {
      await api.post(`/interview/${sessionId}/submit-answer`, {
        questionType: currentSection,
        questionIndex: currentIndex,
        answer: currentAnswer,
        code: currentCode
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }

    // Move to next question
    const maxIndex = currentSection === 'personal' 
      ? questions.personal.length - 1
      : currentSection === 'technical'
      ? questions.technical.length - 1
      : questions.coding.length - 1;

    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer('');
      setCurrentCode('');
    } else {
      // Move to next section
      if (currentSection === 'personal') {
        setCurrentSection('technical');
        setCurrentIndex(0);
        setCurrentAnswer('');
        setCurrentCode('');
      } else if (currentSection === 'technical') {
        setCurrentSection('coding');
        setCurrentIndex(0);
        setCurrentAnswer('');
        setCurrentCode('');
      } else {
        // Interview complete
        handleCompleteInterview();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Load previous answer
      const questionKey = `${currentSection}-${currentIndex - 1}`;
      const savedAnswer = answers[questionKey];
      if (savedAnswer) {
        setCurrentAnswer(savedAnswer.answer || '');
        setCurrentCode(savedAnswer.code || '');
      }
    } else if (currentSection === 'technical') {
      setCurrentSection('personal');
      setCurrentIndex(questions.personal.length - 1);
    } else if (currentSection === 'coding') {
      setCurrentSection('technical');
      setCurrentIndex(questions.technical.length - 1);
    }
  };

  const handleCompleteInterview = async () => {
    setIsSubmitting(true);
    
    try {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);

      const response = await api.post(`/interview/${sessionId}/complete`);

      if (response.data.success) {
        toast.success('Interview completed! Generating your report...');
        navigate(`/dashboard/employee/interview/results/${response.data.reportId}`);
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      toast.error('Failed to complete interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = getCurrentQuestion();
  const progress = (getCurrentQuestionNumber() / getTotalQuestions()) * 100;

  if (!questions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Role Transition Prep"
    >
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar - Inline Timer & Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                <span className="text-lg font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <div className="h-6 w-px bg-gray-600"></div>
              
              <div className="text-sm">
                Question <span className="font-bold">{getCurrentQuestionNumber()}</span> of{' '}
                <span className="font-bold">{getTotalQuestions()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-colors ${
                  isMicOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-2 rounded-lg transition-colors ${
                  isCameraOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full aspect-video object-cover"
              />
              <div className="p-3 bg-gray-900 text-center">
                <p className="text-sm text-gray-400">Your Video</p>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="mt-4 space-y-2">
              {['personal', 'technical', 'coding'].map((section) => (
                <div
                  key={section}
                  className={`p-3 rounded-lg ${
                    currentSection === section
                      ? 'bg-primary-600'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-semibold">{section} Questions</span>
                    <span className="text-sm">
                      {section === 'personal' 
                        ? questions.personal.length 
                        : section === 'technical'
                        ? questions.technical.length
                        : questions.coding.length
                      } questions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question and Answer Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="mb-4">
                <span className="px-3 py-1 bg-primary-600 rounded-full text-sm font-semibold capitalize">
                  {currentSection} Question
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-6 leading-relaxed">
                {currentQuestion}
              </h2>

              {/* Answer Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {currentSection === 'coding' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Code Solution (Optional)
                    </label>
                    <textarea
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      placeholder="// Write your code here..."
                      className="w-full h-64 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentSection === 'personal' && currentIndex === 0}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {getCurrentQuestionNumber() === getTotalQuestions() ? (
                <button
                  onClick={handleCompleteInterview}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete Interview
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default LiveInterviewSession;
