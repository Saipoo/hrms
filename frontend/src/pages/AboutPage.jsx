import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Linkedin, Github, Award, Code, BarChart, Bug, 
  Loader, CheckCircle, XCircle, Send, Heart 
} from 'lucide-react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AboutPage = ({ userRole = 'employee' }) => {
  const [platformInfo, setPlatformInfo] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [versionInfo, setVersionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    feedbackType: 'suggestion',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Role-based colors
  const roleColors = {
    employee: 'blue',
    manager: 'purple',
    hr: 'green'
  };

  const color = roleColors[userRole] || 'blue';

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const [platformRes, teamRes, versionRes] = await Promise.all([
        axios.get(`${API_URL}/api/about/platform`),
        axios.get(`${API_URL}/api/about/team`),
        axios.get(`${API_URL}/api/about/version`)
      ]);

      setPlatformInfo(platformRes.data.data);
      setTeamInfo(teamRes.data.data);
      setVersionInfo(versionRes.data.data);
    } catch (error) {
      console.error('Error fetching about data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      await axios.post(`${API_URL}/api/about/feedback`, feedbackForm, config);

      setSubmitSuccess(true);
      setFeedbackForm({
        name: '',
        email: '',
        feedbackType: 'suggestion',
        subject: '',
        message: ''
      });

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const roleIcons = {
    'Senior Software Developer': Code,
    'Team Lead': Award,
    'Senior Data and Product Analyst': BarChart,
    'Senior Software Tester': Bug
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className={`animate-spin text-${color}-600`} size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title={platformInfo?.title || 'About WorkSphere HRMS'} 
        subtitle={platformInfo?.mission || 'Empowering Enterprises through Intelligent Workforce Management and AI-Driven Insights'}
        icon={Info}
      />

      {/* Platform Overview */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            What is WorkSphere HRMS?
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            {platformInfo?.description || ''}
          </p>

          {/* Stats */}
          {platformInfo?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {Object.entries(platformInfo.stats).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`bg-white rounded-xl p-6 shadow-md text-center border-t-4 border-${color}-500`}
                >
                  <div className={`text-4xl font-bold text-${color}-600 mb-2`}>
                    {value}
                  </div>
                  <div className="text-gray-600 capitalize">{key}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Key Features */}
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Key Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {platformInfo?.keyFeatures?.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">
                      {feature.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Meet the {teamInfo?.teamName || 'IDEA_CRAP'} Team
            </h2>
            <p className="text-gray-600">
              The professional team behind WorkSphere HRMS
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {teamInfo?.members?.map((member, index) => {
              const RoleIcon = roleIcons[member.role] || Code;
              return (
                <motion.div
                  key={member.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-6">
                    {/* Avatar Placeholder */}
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0`}>
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <RoleIcon size={16} className={`text-${color}-600`} />
                        <p className={`text-sm font-medium text-${color}-600`}>
                          {member.role}
                        </p>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {member.bio}
                      </p>

                      {/* Contributions */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Key Contributions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {member.contributions?.slice(0, 2).map((contribution, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full bg-${color}-50 text-${color}-700`}
                            >
                              {contribution}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="flex gap-3">
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Linkedin size={18} />
                          </a>
                        )}
                        {member.github && (
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            <Github size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Technologies Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Powered By
            </h2>
            <p className="text-gray-600">
              Cutting-edge technologies driving WorkSphere HRMS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {versionInfo?.technologies?.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center"
              >
                <div className="text-4xl mb-3">🚀</div>
                <h4 className="font-bold text-gray-800 mb-2">{tech.name}</h4>
                <p className="text-sm text-gray-600">{tech.purpose}</p>
              </motion.div>
            ))}
          </div>

          {/* Version Info */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              <span className="font-semibold">Version:</span> {versionInfo?.version || '2.0.0'} 
              <span className="mx-2">•</span>
              <span className="font-semibold">Released:</span> {versionInfo?.releaseDate || 'October 2025'}
            </p>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Get in Touch
            </h2>
            <p className="text-gray-600">
              Have suggestions, questions, or feedback? We'd love to hear from you!
            </p>
          </div>

          <form onSubmit={handleSubmitFeedback} className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type *
              </label>
              <select
                value={feedbackForm.feedbackType}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent"
              >
                <option value="suggestion">Suggestion</option>
                <option value="question">Question</option>
                <option value="bug_report">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                value={feedbackForm.subject}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent"
                placeholder="Brief description of your feedback"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                required
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent resize-none"
                placeholder="Share your thoughts, ideas, or concerns..."
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <XCircle size={20} />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                <CheckCircle size={20} />
                <span>Thank you! Your feedback has been submitted successfully.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 bg-${color}-600 text-white rounded-lg font-semibold hover:bg-${color}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Feedback</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 text-gray-600"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span>Made with</span>
            <Heart size={18} className="text-red-500 fill-current" />
            <span>by the {teamInfo?.teamName || 'IDEA_CRAP'} Team</span>
          </div>
          <p className="text-sm">
            WorkSphere HRMS © 2025 • Precision in Workforce Management
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
