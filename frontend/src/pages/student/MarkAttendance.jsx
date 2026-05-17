import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  Clock,
  AlertTriangle,
  Home,
  ArrowLeft,
  Building2,
  LogIn,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Haversine distance in metres ────────────────────────────────────────────
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SHIFTS = [
  { id: 'check-in', label: 'Morning Check-In', time: '10:00 AM', icon: LogIn },
  { id: 'check-out', label: 'Evening Check-Out', time: '06:00 PM', icon: LogOut },
  { id: 'remote', label: 'Remote Work', time: 'Any time', icon: Wifi }
];

const MarkAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Face-api state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [stream, setStream] = useState(null);

  // Geolocation state
  const [selectedShift, setSelectedShift] = useState(null);
  const [geoStep, setGeoStep] = useState('idle'); // idle | requesting | verified | failed | remote
  const [userLocation, setUserLocation] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState(null);

  // Attendance submission state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Load office location on mount
  useEffect(() => {
    api.get('/attendance/office-location')
      .then(res => {
        if (res.data.success && res.data.data) {
          const loc = res.data.data;
          setOfficeLocation({
            ...loc,
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
            radius: parseFloat(loc.radius || 100)
          });
        }
      })
      .catch(() => console.warn('No office location configured yet'));
  }, []);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Model load error:', err);
        toast.error('Failed to load face recognition models');
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // ── Step 1: Request geolocation ───────────────────────────────────────────
  const handleRequestLocation = () => {
    if (selectedShift?.id === 'remote') {
      setGeoStep('remote');
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoStep('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        if (selectedShift?.id === 'remote') {
          setGeoStep('remote');
          toast.success('Remote work mode activated.');
          return;
        }

        if (officeLocation) {
          const dist = haversineDistance(
            latitude, longitude,
            officeLocation.latitude, officeLocation.longitude
          );
          setDistanceFromOffice(Math.round(dist));

          if (dist <= officeLocation.radius) {
            setGeoStep('verified');
            toast.success(`✅ Location verified! You are ${Math.round(dist)}m from the office.`);
          } else {
            setGeoStep('failed');
            toast.error(
              `❌ You are ${Math.round(dist)}m away. Must be within ${officeLocation.radius}m to mark attendance.`
            );
          }
        } else {
          // No office location configured → skip distance check
          setGeoStep('verified');
          toast.success('Location captured (no office constraint configured).');
        }
      },
      (err) => {
        setGeoStep('failed');
        toast.error('Could not get location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Step 2: Start camera for face scan ────────────────────────────────────
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(mediaStream);
      setCameraActive(true);
      toast.success('Camera initialized');
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera: ' + err.message);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.error("Video play failed:", err));
    }
  };

  // Attach stream to video when camera becomes active
  useEffect(() => {
    let timeoutId;
    if (cameraActive && stream) {
      // Small delay to ensure video element is rendered in the DOM
      timeoutId = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Video play failed:", err));
        }
      }, 100);
    }
    return () => clearTimeout(timeoutId);
  }, [cameraActive, stream]);

  // Real-time face detection loop
  useEffect(() => {
    if (!cameraActive || !modelsLoaded) return;
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
      const resizedResults = faceapi.resizeResults(detections, dims);

      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resizedResults);

      if (detections.length > 0) {
        setFaceDetected(true);
        // Store descriptor for the first detected face
        videoRef.current.lastDescriptor = Array.from(detections[0].descriptor);
      } else {
        setFaceDetected(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cameraActive, modelsLoaded]);

  // ── Step 3: Submit attendance ─────────────────────────────────────────────
  const handleMarkAttendance = async () => {
    if (!selectedShift) { toast.error('Please select a shift type'); return; }
    if (geoStep !== 'verified' && geoStep !== 'remote') {
      toast.error('Please verify your location first'); return;
    }
    if (geoStep === 'verified' && !faceDetected) {
      toast.error('No face detected. Please look at the camera'); return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // Capture current frame as selfie
      let selfie = null;
      if (videoRef.current && cameraActive) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        selfie = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(selfie);
      }

      const payload = {
        empid: user.empid,
        subject: selectedShift.label, // Use label directly for cleaner subject naming
        mode: geoStep === 'remote' ? 'Remote' : 'Face Recognition',
        status: 'Present',
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
        locationVerified: geoStep === 'verified',
        sessionType: selectedShift.id,
        descriptor: (geoStep === 'verified' && faceDetected) ? videoRef.current?.lastDescriptor : null,
        selfie: selfie, 
        markedBy: `Employee: ${user.name}`
      };

      const res = await fetch(`${API_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        stopCamera();
        toast.success('✅ Attendance marked successfully!');
      } else {
        toast.error(data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      toast.error('Error submitting attendance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Attendance Check-In"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-4xl mx-auto px-6 mt-8">

        {/* Success screen */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="card text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Attendance Marked!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">{today}</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                <strong>{selectedShift?.label}</strong> recorded {geoStep === 'remote' ? '(Remote Work)' : `${distanceFromOffice !== null ? `• ${distanceFromOffice}m from office` : ''}`}
              </p>
              <button onClick={() => navigate('/dashboard/employee/attendance-history')}
                className="btn btn-primary">View My Attendance Records</button>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <>
            {/* Date & Info Card */}
            <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Today's Date</p>
                  <h2 className="text-xl font-bold">{today}</h2>
                  <p className="text-sm opacity-80 mt-1">Employee ID: {user?.empid}</p>
                </div>
                <Clock className="w-12 h-12 opacity-60" />
              </div>
              {officeLocation && (
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Office: {officeLocation.locationName} | Radius: {officeLocation.radius}m</span>
                </div>
              )}
              {!officeLocation && (
                <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-70">
                  ⚠️ No office location configured by admin. Location check is skipped.
                </div>
              )}
            </div>

            {/* Step 1: Shift Selection */}
            <div className="card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Select Session Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SHIFTS.map(shift => {
                  const Icon = shift.icon;
                  return (
                    <button key={shift.id} onClick={() => { setSelectedShift(shift); setGeoStep('idle'); setUserLocation(null); setDistanceFromOffice(null); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedShift?.id === shift.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}>
                      <Icon className={`w-6 h-6 mb-2 ${selectedShift?.id === shift.id ? 'text-blue-600' : 'text-gray-500'}`} />
                      <p className="font-semibold text-sm">{shift.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{shift.time}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Location Verification */}
            {selectedShift && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  {selectedShift.id === 'remote' ? 'Remote Work Mode' : 'Verify Your Location'}
                </h3>

                {geoStep === 'idle' && (
                  <div className="text-center py-4">
                    <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      {selectedShift.id === 'remote'
                        ? 'Click below to mark attendance as Remote Work. Your manager will be notified.'
                        : 'Click below to verify that you are at the office location.'}
                    </p>
                    <button onClick={handleRequestLocation}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                      {selectedShift.id === 'remote' ? <><WifiOff className="w-5 h-5" /> Mark as Remote Work</> : <><Navigation className="w-5 h-5" /> Allow Location Access</>}
                    </button>
                  </div>
                )}

                {geoStep === 'requesting' && (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600">Getting your location…</p>
                  </div>
                )}

                {geoStep === 'verified' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-300 dark:border-green-700 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-300">Location Verified ✓</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {distanceFromOffice !== null ? `${distanceFromOffice}m from ${officeLocation?.locationName}` : 'Location captured'}
                      </p>
                    </div>
                  </div>
                )}

                {geoStep === 'remote' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-300 dark:border-blue-700 flex items-center gap-3">
                    <Wifi className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">Remote Work Mode</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Attendance will be logged as remote work</p>
                    </div>
                  </div>
                )}

                {geoStep === 'failed' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-300 dark:border-red-700 flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-700">Location Verification Failed</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {distanceFromOffice !== null
                            ? `You are ${distanceFromOffice.toFixed(0)}m away. (Outside ${officeLocation?.radius}m radius)`
                            : 'Could not determine your location.'}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleRequestLocation} className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                      Retry Location Verification
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Are you working off-site today? Use <strong>Remote Work</strong> mode instead.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3 (Biometric): Camera Scan */}
            {geoStep === 'verified' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Biometric Face Scan
                </h3>

                {!cameraActive ? (
                  <button onClick={startCamera}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all flex items-center justify-center gap-2">
                    📸 Open Camera for Verification
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black border-2 border-blue-500 shadow-2xl" style={{ height: '480px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={handleVideoPlay}
                      width="640"
                      height="480"
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      width="640"
                      height="480"
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full text-sm font-bold shadow-2xl backdrop-blur-md border ${faceDetected ? 'bg-green-500/90 text-white border-green-400' : 'bg-orange-500/90 text-white border-orange-400'
                      }`}>
                      {faceDetected ? '✅ Identity Verified' : '👤 Align face clearly...'}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3 (Remote): Selfie capture */}
            {geoStep === 'remote' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Remote Verification
                </h3>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-300 flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Please take a verification selfie for your remote attendance log.
                  </p>
                </div>

                {!cameraActive ? (
                  <button onClick={startCamera}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">
                    📸 Open Camera for Selfie
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black border-2 border-blue-500/30 shadow-xl" style={{ height: '480px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={handleVideoPlay}
                      width="640"
                      height="480"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg">
                      CAMERA ACTIVE
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            {selectedShift && (geoStep === 'verified' || geoStep === 'remote') && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button
                  onClick={handleMarkAttendance}
                  disabled={submitting || (geoStep === 'verified' && !faceDetected) || (geoStep === 'remote' && !cameraActive)}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <CheckCircle className="w-7 h-7" />
                  {submitting ? 'Verifying...' : `Confirm ${selectedShift.label}`}
                </button>
                {geoStep === 'verified' && !faceDetected && (
                  <p className="text-center text-sm text-red-500 mt-3 font-medium">⚠️ Please align your face to enable submission</p>
                )}
                {geoStep === 'remote' && !cameraActive && (
                  <p className="text-center text-sm text-blue-500 mt-3 font-medium">📸 Please open camera for remote verification</p>
                )}
              </motion.div>
            )}
        </>
      )}
    </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
