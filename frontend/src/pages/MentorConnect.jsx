import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiPaperclip, FiVideo, FiSearch, FiArrowLeft,
  FiMoreVertical, FiMic, FiSmile, FiX, FiCalendar,
  FiClock, FiCheckCircle, FiUser
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import mentorSocket from '../services/mentorSocket';
import ChatMessage from '../components/ChatMessage';

const MentorConnect = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [showMeetings, setShowMeetings] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const userId = String(user._id);
      console.log('🔌 Connecting socket for user:', userId, 'Role:', user.role);
      mentorSocket.connect(userId);

      // Listen for incoming messages
      mentorSocket.on('receive_message', (message) => {
        if (message.senderId === selectedContact?._id || message.receiverId === user._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
          
          // Mark as delivered
          if (message.senderId === selectedContact?._id) {
            markAsDelivered(message._id);
          }
        }
      });

      // Listen for typing indicator
      mentorSocket.on('user_typing', ({ senderName, isTyping }) => {
        if (selectedContact && senderName === selectedContact.name) {
          setIsTyping(isTyping);
        }
      });

      // Listen for message seen
      mentorSocket.on('message_seen', ({ messageId }) => {
        setMessages(prev =>
          prev.map(msg => msg._id === messageId ? { ...msg, seen: true } : msg)
        );
      });

      // Listen for user status changes
      mentorSocket.on('user_status_changed', ({ userId: onlineUserId, status }) => {
        console.log('👥 User status changed:', onlineUserId, status);
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (status === 'online') {
            updated.add(String(onlineUserId));
          } else {
            updated.delete(String(onlineUserId));
          }
          return updated;
        });
      });

      // Listen for meeting created
      mentorSocket.on('meeting_created', ({ meeting, message }) => {
        console.log('📅 Meeting created event received:', meeting);
        if (meeting) {
          setMeetings(prev => [meeting, ...prev]);
          // Show notification
          alert(`New meeting scheduled: ${meeting.title}`);
        }
        if (message) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      return () => {
        mentorSocket.off('receive_message');
        mentorSocket.off('user_typing');
        mentorSocket.off('message_seen');
        mentorSocket.off('user_status_changed');
        mentorSocket.off('meeting_created');
      };
    }
  }, [user, selectedContact]);

  // Fetch contacts
  useEffect(() => {
    fetchContacts();
    fetchMeetings();
  }, []);

  // Fetch messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact._id);
      // Join chat room
      const roomId = [user._id, selectedContact._id].sort().join('-');
      mentorSocket.joinRoom(roomId, user._id);
    }
  }, [selectedContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    try {
      console.log('🔍 Fetching contacts for user:', user.role, user._id);
      const response = await api.get('/mentor/connect/chat/contacts/list');
      const raw = response.data.data || [];
      console.log('📋 Contacts received:', raw.length, 'contacts', raw);
      
      // Normalize contacts so every item has _id, userId and uppercase studentUSN
      const normalized = raw.map(c => ({
        ...c,
        _id: c._id || c.userId || c.userId,
        userId: c.userId || c._id || c.userId,
        studentUSN: (c.studentUSN || '').toUpperCase()
      }));
      setContacts(normalized);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await api.get(`/mentor/connect/chat/${userId}`);
      setMessages(response.data.data || []);
      
      // Mark all messages as seen
      await api.patch(`/mentor/connect/chat/seen-all/${userId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/mentor/connect/meeting/list/my-meetings');
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const markAsDelivered = async (messageId) => {
    try {
      await api.patch(`/mentor/connect/chat/seen/${messageId}`);
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !selectedContact || isSending) return;

    setIsSending(true);

    try {
      let response;

      if (selectedFile) {
        // Send file message
        const formData = new FormData();
        formData.append('file', selectedFile);
        const receiverId = selectedContact._id || selectedContact.userId;
        formData.append('receiverId', receiverId);
        formData.append('receiverRole', selectedContact.role);
        formData.append('studentUSN', (selectedContact.studentUSN || '').toUpperCase());
        if (newMessage.trim()) {
          formData.append('content', newMessage.trim());
        }

        response = await api.post('/mentor/connect/chat/send-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Send text message
        const receiverId = selectedContact._id || selectedContact.userId;
        response = await api.post('/mentor/connect/chat/send', {
          receiverId,
          receiverRole: selectedContact.role,
          studentUSN: (selectedContact.studentUSN || '').toUpperCase(),
          content: newMessage.trim()
        });
      }

      const sentMessage = response.data.data;
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setSelectedFile(null);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error, error.response?.data || 'no response data');
      alert('Failed to send message. Please try again. See console for details.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (selectedContact && !isTyping) {
      mentorSocket.sendTyping(selectedContact._id, user.name, true);
    }

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      if (selectedContact) {
        mentorSocket.sendTyping(selectedContact._id, user.name, false);
      }
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      const payload = {
        ...meetingData,
        parentId: meetingData.parentId || selectedContact?._id || selectedContact?.userId || '',
        studentUSN: (meetingData.studentUSN || selectedContact?.studentUSN || '').toUpperCase()
      };
      
      console.log('📅 Creating meeting with payload:', payload);
      console.log('📋 Selected contact:', selectedContact);
      
      const response = await api.post('/mentor/connect/meeting/create', payload);
      const { meeting, meetingLink } = response.data.data;
      
      // Add the meeting to the list
      setMeetings(prev => [meeting, ...prev]);
      setShowNewMeeting(false);
      
      alert(`Meeting created successfully! Meeting link: ${meetingLink}`);
    } catch (error) {
      console.error('Error creating meeting:', error, error.response?.data || 'no response data');
      const errorMsg = error.response?.data?.message || 'Failed to create meeting';
      alert(`${errorMsg}. Please try again. See console for details.`);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.studentUSN?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (contactId) => {
    return messages.filter(
      msg => msg.senderId === contactId && !msg.seen
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg p-6 flex items-center justify-between flex-shrink-0"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <FiVideo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Executive Mentorship
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role === 'teacher' ? 'Connect with HR' : 'Connect with Managers'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowMeetings(!showMeetings)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showMeetings
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiCalendar className="inline w-5 h-5 mr-2" />
              Meetings
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 shadow-lg rounded-b-2xl flex overflow-hidden">
          {/* Contacts Sidebar - Always visible with fixed width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          >
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <FiUser className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No contacts found</p>
                  <p className="text-sm">Start a conversation to see contacts here</p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const contactId = String(contact._id || contact.userId || '');
                  const isOnline = onlineUsers.has(contactId);
                  const unreadCount = getUnreadCount(contact._id);
                  
                  console.log('👤 Contact:', contact.name, 'ID:', contactId, 'Online:', isOnline, 'OnlineUsers:', Array.from(onlineUsers));
                  
                  return (
                    <motion.div
                      key={contact._id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition ${
                        selectedContact?._id === contact._id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                            {contact.name?.charAt(0).toUpperCase()}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                              {contact.name}
                            </h3>
                            {unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {contact.role === 'teacher' ? 'Manager' : 'HR'} • {contact.studentName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            USN: {contact.studentUSN}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Chat Area */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {selectedContact.name?.charAt(0).toUpperCase()}
                      </div>
                      {onlineUsers.has(selectedContact._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {selectedContact.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {onlineUsers.has(selectedContact._id) ? 'Online' : 'Offline'} • {selectedContact.studentName}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/meeting/new`;
                        // Can add logic to copy a generic link if needed, or just schedule
                        setShowNewMeeting(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <FiVideo className="w-4 h-4" />
                      Schedule Meeting
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <FiSend className="w-16 h-16 mb-4" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        // Convert both IDs to strings for reliable comparison
                        const messageSenderId = String(message.senderId || '');
                        const currentUserId = String(user._id || '');
                        const isSender = messageSenderId === currentUserId;
                        
                        // Debug logging (remove after fixing)
                        console.log('💬 Message rendering:', {
                          messageId: message._id,
                          messageSenderId,
                          currentUserId,
                          isSender,
                          senderRole: message.senderRole,
                          currentUserRole: user.role
                        });
                        
                        return (
                          <ChatMessage
                            key={message._id}
                            message={message}
                            isSender={isSender}
                            senderName={isSender ? user.name : selectedContact.name}
                          />
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm"
                    >
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span>{selectedContact.name} is typing...</span>
                    </motion.div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {selectedFile && (
                    <div className="mb-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <FiPaperclip className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                        {selectedFile.name}
                      </span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                    >
                      <FiPaperclip className="w-6 h-6" />
                    </button>

                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSending}
                    />

                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && !selectedFile) || isSending}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-full transition"
                    >
                      {isSending ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiSend className="w-6 h-6" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FiVideo className="w-24 h-24 mb-6 text-blue-200 dark:text-blue-800" />
                <h2 className="text-2xl font-bold mb-2">Welcome to Executive Mentorship</h2>
                <p className="text-center max-w-md">
                  Select a contact from the sidebar to start chatting or schedule a professional briefing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Meetings Modal */}
        <AnimatePresence>
          {showMeetings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowMeetings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    My Meetings
                  </h2>
                  <button
                    onClick={() => setShowMeetings(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                  {meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                      <FiCalendar className="w-16 h-16 mb-4" />
                      <p className="text-lg font-medium">No meetings scheduled</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {meetings.map((meeting) => (
                        <motion.div
                          key={meeting._id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl border border-blue-200 dark:border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                {meeting.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {meeting.description}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              meeting.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              meeting.status === 'Ongoing' ? 'bg-green-100 text-green-800' :
                              meeting.status === 'Ended' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {meeting.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-4 h-4" />
                              {new Date(meeting.scheduledTime).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <FiClock className="w-4 h-4" />
                              {new Date(meeting.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-2">
                              <FiUser className="w-4 h-4" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Host: {meeting.teacherName || 'User'} {meeting.parentName ? `• Guest: ${meeting.parentName}` : ''}
                              </span>
                            </div>
                          </div>

                          {meeting.status === 'Scheduled' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => window.open(meeting.meetingLink, '_blank')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition text-center"
                              >
                                Join Meeting
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(meeting.meetingLink);
                                  alert('Meeting link copied to clipboard!');
                                }}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-center"
                                title="Copy Link"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Meeting Modal */}
        <AnimatePresence>
          {showNewMeeting && selectedContact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNewMeeting(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Schedule Meeting
                  </h2>
                  <button
                    onClick={() => setShowNewMeeting(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleCreateMeeting({
                      parentId: selectedContact._id,
                      studentUSN: selectedContact.studentUSN,
                      title: formData.get('title'),
                      description: formData.get('description'),
                      scheduledTime: formData.get('scheduledTime'),
                      duration: parseInt(formData.get('duration')),
                      platform: formData.get('platform')
                    });
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 1-on-1 Sync, HR Briefing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows="3"
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Discuss project updates and performance"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scheduled Time
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledTime"
                      required
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min="15"
                      max="180"
                      defaultValue="30"
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Platform
                    </label>
                    <select
                      name="platform"
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                    >
                      <option value="Jitsi">Jitsi Meet (Recommended)</option>
                      <option value="WebRTC">WebRTC (Direct Browser)</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <strong>Jitsi Meet</strong> provides a stable, full-featured external meeting room. <br/>
                      <strong>WebRTC</strong> connects directly within the browser tab (best for quick 1-on-1s).
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewMeeting(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      Create Meeting
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MentorConnect;
