import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Target,
  Briefcase,
  Lightbulb,
  Award,
  ChevronRight,
  TrendingUp,
  Map
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const EmployeeCareerAdvisor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentRole: '',
    targetRole: '',
    skills: ''
  });
  const [roadmap, setRoadmap] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.currentRole || !formData.targetRole) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/career/employee-roadmap`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRoadmap(response.data.roadmap);
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Career Growth AI"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Form Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Career Goals</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Define your next move</p>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.currentRole}
                    onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                    placeholder="e.g. Junior Developer"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetRole}
                    onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                    placeholder="e.g. Senior Tech Lead"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Skills (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="e.g. JavaScript, React, basic Node.js"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Roadmap...
                    </>
                  ) : (
                    <>
                      <Map className="w-5 h-5" />
                      Generate Career Roadmap
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[600px]">
              {roadmap ? (
                  <div className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                    {roadmap}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    AI Career Strategist
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Tell me where you are now and where you want to be. I'll analyze your path and build a step-by-step roadmap to get you there.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeCareerAdvisor;
