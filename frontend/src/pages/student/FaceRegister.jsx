import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import {
  Camera,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader,
  ScanFace
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const FaceRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedEmbeddings, setCapturedEmbeddings] = useState([]);
  const [stream, setStream] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadModels();
    checkRegistration();
    
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      toast.success('Face detection models loaded!');
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load face detection models. Using fallback mode.');
      setModelsLoaded(true); // Allow to proceed even if models fail
    }
  };

  const checkRegistration = async () => {
    try {
    const response = await api.get(`/face/check/${user.empid}`);
      if (response.data.registered) {
        setIsRegistered(true);
        toast.info('Face already registered!');
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
        toast.success('Camera started!');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || capturing) return;

    setCapturing(true);
    toast.loading('Detecting face...');

    try {
      // If models are loaded, use face-api.js
      if (modelsLoaded && faceapi.nets.tinyFaceDetector.isLoaded) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptor = Array.from(detection.descriptor);
          setCapturedEmbeddings(prev => [...prev, descriptor]);
          
          // Draw detection on canvas
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const displaySize = {
              width: videoRef.current.width,
              height: videoRef.current.height
            };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
          }

          toast.dismiss();
          toast.success(`Face captured! (${capturedEmbeddings.length + 1}/3)`);
        } else {
          toast.dismiss();
          toast.error('No face detected. Please position your face clearly.');
        }
      } else {
        // Fallback: Generate random embeddings for demo
        const randomEmbedding = Array.from({ length: 128 }, () => Math.random());
        setCapturedEmbeddings(prev => [...prev, randomEmbedding]);
        toast.dismiss();
        toast.success(`Face captured! (${capturedEmbeddings.length + 1}/3) [Demo Mode]`);
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.dismiss();
      toast.error('Error detecting face. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const registerFace = async () => {
    if (capturedEmbeddings.length < 3) {
      toast.error('Please capture at least 3 face angles');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/face/register', {
        empid: user.empid,
        name: user.name,
        department: user.department,
        designation: user.designation,
        embeddings: capturedEmbeddings
      });

      if (response.data.success) {
        toast.success('Face registered successfully! 🎉');
        stopCamera();
        setTimeout(() => {
          navigate('/dashboard/employee');
        }, 2000);
      }
    } catch (error) {
      console.error('Error registering face:', error);
      toast.error(error.response?.data?.message || 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  const resetCapture = () => {
    setCapturedEmbeddings([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    toast.info('Capture reset. Start over!');
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Face Registration"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {isRegistered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 mb-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Face Already Registered
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your face has been registered. You can mark attendance using facial recognition.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <h2 className="text-xl font-bold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click "Start Camera" to begin</li>
            <li>Position your face clearly in the camera frame</li>
            <li>Capture your face from 3 different angles (front, left, right)</li>
            <li>Ensure good lighting and remove any obstructions</li>
            <li>Click "Register Face" when you have 3 captures</li>
          </ol>
        </motion.div>

        {/* Camera Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '480px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="640"
              height="480"
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Camera is off</p>
                </div>
              </div>
            )}

            {/* Capture Count */}
            {cameraActive && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">{capturedEmbeddings.length}/3</span> captured
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={!modelsLoaded}
                  className="btn-primary flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  {modelsLoaded ? 'Start Camera' : 'Loading Models...'}
                </button>
              ) : (
                <>
                  <button
                    onClick={captureFace}
                    disabled={capturing || capturedEmbeddings.length >= 3}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {capturing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        Capture Face
                      </>
                    )}
                  </button>

                  <button
                    onClick={stopCamera}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Stop Camera
                  </button>

                  {capturedEmbeddings.length > 0 && (
                    <button
                      onClick={resetCapture}
                      className="btn-secondary flex items-center gap-2"
                    >
                      Reset
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Register Button */}
            {capturedEmbeddings.length >= 3 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={registerFace}
                disabled={loading}
                className="w-full btn-primary bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Register Face
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Captured Faces Preview */}
          {capturedEmbeddings.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Captured Faces: {capturedEmbeddings.length}
              </h3>
              <div className="flex gap-2">
                {capturedEmbeddings.map((_, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center text-green-800 dark:text-green-200 font-bold"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Model Status */}
        {!modelsLoaded && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              ⚠️ Note: Face detection models are loading or unavailable. The system will work in demo mode.
            </p>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default FaceRegister;
