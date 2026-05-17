import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiVideo, FiMic, FiMicOff, FiVideoOff, FiMonitor,
  FiPhone, FiUsers, FiSettings, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import mentorSocket from '../services/mentorSocket';

const VideoMeeting = () => {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [remoteParticipantName, setRemoteParticipantName] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  // Callback refs to handle React mounting latency
  const setLocalVideo = (el) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  };

  const setRemoteVideo = (el) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
  };
  const containerRef = useRef(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    fetchMeetingDetails();
    initializeMedia();

    return () => {
      cleanup();
    };
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await api.get(`/mentor/connect/meeting/${meetingId}`);
      const meetingData = response.data.data;
      setMeeting(meetingData);
      setIsLoading(false);

      // Set initial remote name guess based on role
      if (user.role === 'teacher') {
        setRemoteParticipantName(meetingData.parentName || meetingData.studentName || 'Employee');
      } else {
        setRemoteParticipantName(meetingData.teacherName || 'Manager');
      }

      // Auto-join the meeting
      await api.patch(`/mentor/connect/meeting/${meetingId}/join`);

      // If teacher and meeting is scheduled, start it
      if (user.role === 'teacher' && meetingData.status === 'Scheduled') {
        await api.patch(`/mentor/connect/meeting/${meetingId}/start`);
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      setError('Failed to load meeting. Please check the link and try again.');
      setIsLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      initializePeerConnection();

      // Connect to socket room after peer connection and local media tracks are fully ready
      joinMeetingSocket();
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const initializePeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection(iceServers);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        mentorSocket.sendICECandidate(meetingId, event.candidate, remoteSocketIdRef.current);
      }
    };

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
    };
  };

  const joinMeetingSocket = () => {
    mentorSocket.joinMeeting(meetingId);

    // Listen for WebRTC offers
    mentorSocket.on('webrtc_offer', async ({ offer, socketId }) => {
      try {
        remoteSocketIdRef.current = socketId; // Store remote socket ID
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        mentorSocket.sendWebRTCAnswer(meetingId, answer, socketId);

        // Flush queued candidates
        for (const c of iceCandidateQueue.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        iceCandidateQueue.current = [];
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Listen for WebRTC answers
    mentorSocket.on('webrtc_answer', async ({ answer }) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued candidates
        for (const c of iceCandidateQueue.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        iceCandidateQueue.current = [];
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // Listen for ICE candidates
    mentorSocket.on('webrtc_ice_candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current?.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueue.current.push(candidate); // Queue it
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Listen for participant joined
    mentorSocket.on('participant_joined', async (data) => {
      if (!data.socketId) return; // Ignore the HTTP-triggered event to avoid undefined offerer target

      setParticipants(prev => [...prev, data]);
      if (data.name) {
        setRemoteParticipantName(data.name);
      }

      remoteSocketIdRef.current = data.socketId; // Store remote socket ID

      // Create and send offer to new participant
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        mentorSocket.sendWebRTCOffer(meetingId, offer, data.socketId);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    // Listen for meeting ended
    mentorSocket.on('meeting_ended', () => {
      alert('The meeting has ended');
      cleanup();
      navigate('/dashboard');
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = peerConnectionRef.current
          .getSenders()
          .find(s => s.track.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      const sender = peerConnectionRef.current
        .getSenders()
        .find(s => s.track.kind === 'video');
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
    
    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const endMeeting = async () => {
    if (window.confirm('Are you sure you want to end the meeting?')) {
      try {
        if (user.role === 'teacher') {
          await api.patch(`/mentor/connect/meeting/${meetingId}/end`);
        }
        cleanup();
        navigate('/mentor-connect');
      } catch (error) {
        console.error('Error ending meeting:', error);
      }
    }
  };

  const cleanup = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Leave meeting socket room
    mentorSocket.leaveMeeting(meetingId);

    // Remove socket listeners
    mentorSocket.off('webrtc_offer');
    mentorSocket.off('webrtc_answer');
    mentorSocket.off('webrtc_ice_candidate');
    mentorSocket.off('participant_joined');
    mentorSocket.off('meeting_ended');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FiVideo className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Meeting Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/mentor-connect')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Back to Mentor Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{meeting?.title}</h1>
          <p className="text-sm text-gray-400">
            {meeting?.teacherName} • {meeting?.parentName}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg">
            <FiUsers className="w-4 h-4 text-gray-400" />
            <span className="text-white text-sm">{participants.length + 1}</span>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition"
          >
            {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
        >
          <video
            ref={setLocalVideo}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white font-medium">{user?.name} (You)</p>
          </div>
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white">Camera is off</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Remote Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
        >
          <video
            ref={setRemoteVideo}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white font-medium">
              {remoteParticipantName || (user?.role === 'teacher' ? 'Employee' : 'Manager')}
            </p>
          </div>
        </motion.div>

        {/* Screen Share (if active) */}
        {isScreenSharing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl md:col-span-2"
          >
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-white font-medium">Screen Share</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition ${
              isAudioOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${
              isVideoOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <FiVideo className="w-6 h-6" /> : <FiVideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <FiMonitor className="w-6 h-6" />
          </button>

          <button
            onClick={endMeeting}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
            title="End meeting"
          >
            <FiPhone className="w-6 h-6 rotate-135" />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Meeting ID: <span className="text-white font-mono">{meetingId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoMeeting;
