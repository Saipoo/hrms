import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Lock, User, MessageSquare, AlertCircle,
  CheckCircle, Loader, Shield, Heart, Brain
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ConfessionModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Category, 2: Write, 3: AI Response, 4: Confirmation
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('Anonymous');
  const [shareWithParent, setShareWithParent] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confessionId, setConfessionId] = useState('');
  const [error, setError] = useState('');

  const categories = [
    { name: 'Work/Job Issue', icon: '💼', description: 'Job difficulty, duties, understanding work material' },
    { name: 'Manager/Lead Concern', icon: '👨‍💼', description: 'Issues with managers or leadership' },
    { name: 'Colleague/Peer Conflict', icon: '🤝', description: 'Problems with coworkers or team collaboration' },
    { name: 'Personal/Emotional Concern', icon: '💭', description: 'Stress, anxiety, work-life balance' },
    { name: 'Office/Work Environment', icon: '🏢', description: 'Facilities, tools, workspace resources' },
    { name: 'Harassment/Disciplinary Issue', icon: '🚨', description: 'Serious concerns requiring immediate attention' },
    { name: 'Other', icon: '💬', description: 'Any other concerns' }
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setCategory('');
        setContent('');
        setVisibility('Anonymous');
        setShareWithParent(false);
        setAiResponse('');
        setSubmitted(false);
        setConfessionId('');
        setError('');
      }, 300);
    }
  }, [isOpen]);

  // Get AI empathetic response
  const getAIResponse = async () => {
    if (!content.trim()) {
      setError('Please write your concern first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/confessions/ai/empathetic-response`,
        { content, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAiResponse(response.data.data.aiResponse);
      setStep(3);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(err.response?.data?.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  // Submit confession
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/confessions`,
        {
          category,
          content,
          visibility,
          shareWithParent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfessionId(response.data.data.confessionId);
      setSubmitted(true);
      setStep(4);
    } catch (err) {
      console.error('Error submitting confession:', err);
      setError(err.response?.data?.message || 'Failed to submit confession');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Your Space is Safe</h2>
                    <p className="text-blue-100 text-sm">Share your concerns confidentially</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 flex items-center space-x-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all ${
                      step >= s ? 'bg-white flex-1' : 'bg-white/30 w-8'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Step 1: Category Selection */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    What would you like to share?
                  </h3>
                  <div className="grid gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setCategory(cat.name);
                          setStep(2);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                          category === cat.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-3xl">{cat.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{cat.name}</h4>
                            <p className="text-sm text-gray-600">{cat.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Write Confession */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-blue-600 hover:underline text-sm flex items-center space-x-1"
                    >
                      <span>←</span>
                      <span>Change category</span>
                    </button>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">
                      {categories.find(c => c.name === category)?.icon} {category}
                    </h3>
                  </div>

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share what's on your mind... We're here to listen and help."
                    className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />

                  {/* Privacy Options */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Lock className="text-gray-600" size={20} />
                        <div>
                          <h4 className="font-medium text-gray-800">Visibility</h4>
                          <p className="text-sm text-gray-600">
                            {visibility === 'Anonymous' 
                              ? 'Your identity is hidden'
                              : 'Manager/Admin can see your name'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setVisibility(visibility === 'Anonymous' ? 'Identified' : 'Anonymous')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          visibility === 'Anonymous'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {visibility === 'Anonymous' ? (
                          <span className="flex items-center space-x-2">
                            <Shield size={16} />
                            <span>Anonymous</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2">
                            <User size={16} />
                            <span>Identified</span>
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Heart className="text-purple-600" size={20} />
                        <div>
                          <h4 className="font-medium text-gray-800">Share with HR / Care Team</h4>
                          <p className="text-sm text-gray-600">
                            {shareWithParent 
                              ? 'HR can view this concern for corporate support'
                              : 'Keep this concern private from HR'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShareWithParent(!shareWithParent)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          shareWithParent
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {shareWithParent ? 'Shared' : 'Private'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={getAIResponse}
                    disabled={loading || !content.trim()}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        <span>Getting AI support...</span>
                      </>
                    ) : (
                      <>
                        <Heart size={20} />
                        <span>Get AI Support & Continue</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Step 3: AI Empathetic Response */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                      <Brain className="text-purple-600" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      AI Counselor Response
                    </h3>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200 mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">What happens next?</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Your concern will be reviewed by appropriate staff</li>
                          <li>You'll receive updates on resolution progress</li>
                          <li>Your privacy will be protected as per your settings</li>
                          <li>Help is available if you need immediate support</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ← Go Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          <span>Submit Confession</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success Confirmation */}
              {step === 4 && submitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-block p-6 bg-green-100 rounded-full mb-6"
                  >
                    <CheckCircle className="text-green-600" size={64} />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Confession Submitted Successfully
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Reference ID: <span className="font-mono font-semibold text-blue-600">{confessionId}</span>
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
                    <h4 className="font-semibold text-gray-800 mb-3">✅ What's next?</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Your concern has been securely recorded</li>
                      <li>• Appropriate staff will review it within 24-48 hours</li>
                      <li>• You'll receive updates via your dashboard</li>
                      <li>• Your privacy is protected as per your settings</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start space-x-3">
                      <Heart className="text-purple-600 flex-shrink-0 mt-1" size={24} />
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-800 mb-2">Remember</h4>
                        <p className="text-sm text-gray-700">
                          You're not alone. Taking this step shows courage. Our team is here to support you.
                          If you need immediate help, please contact your counselor or use the emergency support number.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ConfessionModal;
