import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Menu, 
  ExternalLink,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FloatingChatbot = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuOptions, setMenuOptions] = useState([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Role-based styling
  const roleColors = {
    student: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    teacher: {
      primary: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    parent: {
      primary: 'bg-green-600',
      hover: 'hover:bg-green-700',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    }
  };

  const colors = roleColors[userRole] || roleColors.student;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadGreeting();
    }
  }, [isOpen]);

  const loadGreeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chatbot/greeting`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([{
        id: Date.now(),
        type: 'bot',
        content: response.data.data.greeting,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to load greeting:', error);
      setMessages([{
        id: Date.now(),
        type: 'bot',
        content: `Hi! 👋 I'm your WorkSphere HR Assistant. How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  };

  const loadMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chatbot/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const menuOpts = response.data.data.menuOptions;
      
      // Add menu message to chat
      const menuMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Here are the available features you can explore:\n\n${menuOpts.map(m => `${m.icon} **${m.label}**`).join('\n')}\n\nClick any option below to navigate!`,
        timestamp: new Date(),
        actionType: 'menu',
        menuOptions: menuOpts
      };

      setMessages(prev => [...prev, menuMessage]);
      setMenuOptions(menuOpts);
      setShowMenu(true);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/chatbot/query`,
        {
          query: inputValue,
          sessionId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { response: aiResponse, actionType, navigationTarget, featureName, menuOptions: menuOpts, externalLink } = response.data.data;

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        timestamp: new Date(),
        actionType,
        navigationTarget,
        featureName,
        menuOptions: menuOpts,
        externalLink
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 800);

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Oops! I'm having trouble connecting right now. 😅 Please try again in a moment.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleNavigation = (route, isExternal = false) => {
    if (isExternal) {
      window.open(route, '_blank');
    } else {
      navigate(route);
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 left-6 ${colors.primary} ${colors.hover} text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300`}
          >
            <MessageCircle size={28} />
            <motion.span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              AI
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className={`${colors.primary} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MessageCircle size={24} />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">WorkSphere HR Assistant</h3>
                  <p className="text-xs opacity-90">Always here to help 🤖</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                >
                  {isMinimized ? <ChevronDown size={18} /> : <Minimize2 size={18} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.type === 'user'
                            ? `${colors.primary} text-white`
                            : 'bg-white border border-gray-200'
                        } rounded-2xl px-4 py-3 shadow-sm`}
                      >
                        <div
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                        />
                        
                        {/* Action Buttons */}
                        {message.navigationTarget && (
                          <button
                            onClick={() => handleNavigation(message.navigationTarget)}
                            className={`mt-3 ${colors.text} ${colors.light} px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-all flex items-center space-x-2 w-full justify-center`}
                          >
                            <span>Open {message.featureName}</span>
                            <ExternalLink size={14} />
                          </button>
                        )}

                        {/* External Link */}
                        {message.externalLink && (
                          <button
                            onClick={() => handleNavigation(message.externalLink, true)}
                            className="mt-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center space-x-2 w-full justify-center"
                          >
                            <span>🪄 Explore PoornaGPT</span>
                            <ExternalLink size={14} />
                          </button>
                        )}

                        {/* Menu Options */}
                        {message.menuOptions && (
                          <div className="mt-3 space-y-2">
                            {message.menuOptions.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleNavigation(option.route, option.external)}
                                className={`${colors.light} ${colors.text} px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-all flex items-center space-x-2 w-full`}
                              >
                                <span>{option.icon}</span>
                                <span className="flex-1 text-left">{option.label}</span>
                                {option.external && <ExternalLink size={12} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex space-x-2">
                          <motion.div
                            className={`w-2 h-2 ${colors.primary} rounded-full`}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.div
                            className={`w-2 h-2 ${colors.primary} rounded-full`}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          />
                          <motion.div
                            className={`w-2 h-2 ${colors.primary} rounded-full`}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={loadMenu}
                      className={`${colors.light} ${colors.text} px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-all flex items-center space-x-1`}
                    >
                      <Menu size={16} />
                      <span>Menu</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className={`${colors.primary} ${colors.hover} text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;
