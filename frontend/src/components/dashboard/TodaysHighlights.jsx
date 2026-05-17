import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Briefcase, 
  Quote, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Clock,
  Eye,
  Loader
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TodaysHighlights = () => {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/updates/dashboard/highlights`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHighlights(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return posted.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'education': 'bg-blue-100 text-blue-800',
      'ai-tech': 'bg-purple-100 text-purple-800',
      'jobs-internships': 'bg-green-100 text-green-800',
      'motivation': 'bg-pink-100 text-pink-800',
      'startups-ceos': 'bg-orange-100 text-orange-800',
      'general-knowledge': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'education': 'Training',
      'ai-tech': 'AI & Tech',
      'jobs-internships': 'Internal Openings',
      'motivation': 'Corporate Spirit',
      'startups-ceos': 'Leadership',
      'general-knowledge': 'Company News'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!highlights) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Today's Highlights</h2>
        </div>
        <button
          onClick={() => navigate('/dashboard/employee/updates')}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Quote of the Day */}
      {highlights.quote && (
        <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-indigo-600 shadow-sm">
          <div className="flex items-start">
            <Quote className="w-5 h-5 text-indigo-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-800 font-medium italic mb-2">
                "{highlights.quote.quote}"
              </p>
              <p className="text-sm text-gray-600">
                — {highlights.quote.author}
              </p>
              {highlights.quote.context && (
                <p className="text-xs text-gray-500 mt-1">
                  {highlights.quote.context}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Featured Job */}
      {highlights.featuredJob && (
        <div className="bg-green-50 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/dashboard/employee/updates')}>
          <div className="flex items-start">
            <div className="bg-green-600 rounded-lg p-2 mr-3">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-green-700">
                  Featured Opportunity
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(highlights.featuredJob.postedAt)}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {highlights.featuredJob.title}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                {highlights.featuredJob.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Updates */}
      {highlights.trendingUpdates && highlights.trendingUpdates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
            Trending Now
          </div>
          
          {highlights.trendingUpdates.slice(0, 5).map((update, index) => (
            <div
              key={update._id}
              onClick={() => navigate('/dashboard/employee/updates')}
              className="bg-white rounded-lg p-3 hover:shadow-md transition-all cursor-pointer border border-gray-100"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(update.category)}`}>
                  {getCategoryLabel(update.category)}
                </span>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {update.viewCount || 0}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(update.postedAt)}
                  </span>
                </div>
              </div>
              
              <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                {update.title}
              </h4>
              
              <p className="text-xs text-gray-600 line-clamp-2">
                {update.summary}
              </p>

              {update.aiGenerated && (
                <div className="flex items-center mt-2">
                  <Sparkles className="w-3 h-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600">AI Curated</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Stats */}
      {highlights.categoryCounts && highlights.categoryCounts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Available Updates by Category:</p>
          <div className="flex flex-wrap gap-2">
            {highlights.categoryCounts.map((cat) => (
              <span
                key={cat._id}
                className="text-xs px-2 py-1 bg-white rounded-full text-gray-700 border border-gray-200"
              >
                {getCategoryLabel(cat._id)}: <span className="font-semibold">{cat.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <button
        onClick={() => navigate('/dashboard/employee/updates')}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
      >
        Explore All Updates
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
};

export default TodaysHighlights;
