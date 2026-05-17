import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Newspaper, 
  Search, 
  Filter, 
  Clock, 
  Eye, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  Briefcase,
  Heart,
  Rocket,
  Brain,
  BookOpen,
  X,
  Loader,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RealTimeUpdates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUpdates, setTotalUpdates] = useState(0);

  const categories = [
    { id: 'all', label: 'All Updates', icon: Newspaper, color: 'indigo' },
    { id: 'education', label: 'Workforce & HR', icon: BookOpen, color: 'blue' },
    { id: 'ai-tech', label: 'Enterprise Tech', icon: Brain, color: 'purple' },
    { id: 'jobs-internships', label: 'Career Growth', icon: Briefcase, color: 'green' },
    { id: 'motivation', label: 'Professional Motivation', icon: Heart, color: 'pink' }
  ];

  const fetchUpdates = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        page: pageNum,
        limit: 10,
        sortBy: 'postedAt',
        order: 'desc'
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await axios.get(`${API_URL}/api/updates`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        const newUpdates = response.data.data;
        setUpdates(reset ? newUpdates : [...updates, ...newUpdates]);
        setHasMore(response.data.page < response.data.pages);
        setTotalUpdates(response.data.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, updates]);

  useEffect(() => {
    setLoading(true);
    setUpdates([]);
    setPage(1);
    fetchUpdates(1, true);
  }, [selectedCategory, searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchUpdates(page + 1, false);
    }
  };

  const openUpdateDetail = async (update) => {
    setSelectedUpdate(update);
    try {
      const token = localStorage.getItem('token');
      await axios.get(`${API_URL}/api/updates/${update._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const closeUpdateDetail = () => {
    setSelectedUpdate(null);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return posted.toLocaleDateString();
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'gray';
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : Newspaper;
  };

  const UpdateCard = ({ update }) => {
    const Icon = getCategoryIcon(update.category);
    const color = getCategoryColor(update.category);

    return (
      <div
        onClick={() => openUpdateDetail(update)}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
      >
        {update.imageUrl && (
          <div className="h-48 overflow-hidden">
            <img
              src={update.imageUrl}
              alt={update.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
              <Icon className="w-3 h-3 mr-1" />
              {categories.find(c => c.id === update.category)?.label}
            </span>
            
            {update.aiGenerated && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Curated
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {update.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {update.summary}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(update.postedAt)}
              </span>
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {update.viewCount || 0} views
              </span>
            </div>
            {update.priority >= 8 && (
              <span className="flex items-center text-orange-600 font-medium">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="HR Announcements"
    >
      <div className="max-w-7xl mx-auto py-6">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search HR announcements..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? `bg-${category.color}-600 text-white shadow-md`
                      : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700`
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Updates Grid */}
        {loading && updates.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No announcements found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {updates.map((update) => (
                <UpdateCard key={update._id} update={update} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 transition-all font-medium"
                >
                  {loading ? 'Loading...' : 'Load More Announcements'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedUpdate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold dark:text-white line-clamp-1">{selectedUpdate.title}</h2>
              <button onClick={closeUpdateDetail} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-6 h-6 dark:text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
              {selectedUpdate.imageUrl && (
                <img src={selectedUpdate.imageUrl} alt="" className="w-full h-72 object-cover rounded-xl mb-6 shadow-lg" />
              )}
              <div className="prose dark:prose-invert max-w-none">
                <div className="flex flex-wrap gap-2 mb-6">
                   <span className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200`}>
                    {selectedUpdate.category}
                  </span>
                  {selectedUpdate.aiGenerated && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                      AI Curated
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                  {selectedUpdate.summary}
                </p>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold dark:text-white">Full Context</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                    {selectedUpdate.detailedContent}
                  </p>
                </div>
                {selectedUpdate.keyPoints?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold dark:text-white mb-4">Key Takeaways</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedUpdate.keyPoints.map((p, i) => (
                        <li key={i} className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <ChevronRight className="w-5 h-5 text-indigo-500 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RealTimeUpdates;
