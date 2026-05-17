import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2,
  Users, 
  BarChart2, 
  Calendar, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Moon,
  Sun,
  MapPin,
  Award,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();

  const modules = [
    {
      title: 'AI-Powered Attendance',
      description: 'Geolocation-based employee check-in/check-out with facial recognition',
      icon: <MapPin className="w-12 h-12" />,
      status: 'Active',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Performance Reviews',
      description: 'AI-powered employee performance analysis and reporting',
      icon: <TrendingUp className="w-12 h-12" />,
      status: 'Active',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Work Planner',
      description: 'Personalized work schedules, tasks and productivity tools',
      icon: <Calendar className="w-12 h-12" />,
      status: 'Active',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'HR Growth Advisor',
      description: 'AI-driven career growth guidance and HR recommendations',
      icon: <Briefcase className="w-12 h-12" />,
      status: 'Active',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    {
      title: 'Workforce Analytics',
      description: 'Real-time enterprise workforce intelligence and reporting',
      icon: <BarChart2 className="w-12 h-12" />,
      status: 'Active',
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      title: 'Training Management',
      description: 'Employee training programs with AI-powered recommendations',
      icon: <Award className="w-12 h-12" />,
      status: 'Active',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar */}
      <nav className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Building2 className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                WorkSphere HRMS
              </span>
            </motion.div>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              
              <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-purple-600 bg-clip-text text-transparent">
              Smart Enterprise
            </span>
            <br />
            <span className="text-gray-800 dark:text-gray-100">
              HR Management
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            WorkSphere HRMS revolutionizes workforce management with AI-powered geolocation attendance,
            performance analytics, training programs, and intelligent HR insights for modern enterprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2">
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="btn-secondary inline-flex items-center justify-center gap-2">
              Watch Demo
              <Building2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-center mb-4">
            AI-Powered <span className="text-primary-600">HRMS Modules</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Comprehensive suite of intelligent tools designed to streamline every aspect of enterprise workforce management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:scale-105 cursor-pointer relative overflow-hidden"
              >
                <div className={`${module.bgColor} p-4 rounded-lg inline-block mb-4`}>
                  <div className={module.color}>
                    {module.icon}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    module.status === 'Active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {module.status}
                  </span>
                </div>

                {module.status === 'Active' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold transform rotate-45 translate-x-8 translate-y-2">
                    LIVE
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Enterprises', value: '500+' },
            { label: 'Employees Managed', value: '50K+' },
            { label: 'Accuracy', value: '99.8%' },
            { label: 'Uptime', value: '99.9%' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workforce Management?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of enterprises using WorkSphere HRMS to manage their workforce efficiently
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all">
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 WorkSphere HRMS. All rights reserved.</p>
            <p className="mt-2">Smart Enterprise Human Resource Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
