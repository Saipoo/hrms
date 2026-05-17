import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Building2,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children, menuItems, role, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // HRMS role display mapping
  const roleDisplayMap = {
    student: 'Employee',
    teacher: 'Manager',
    parent: 'HR Manager',
    admin: 'System Administrator'
  };
  const displayRole = roleDisplayMap[role] || role.charAt(0).toUpperCase() + role.slice(1);

  // Role home dashboard map
  const roleDashboardMap = {
    student: '/dashboard/employee',
    teacher: '/dashboard/manager',
    parent: '/dashboard/hr',
    admin: '/dashboard/admin'
  };
  const homePath = roleDashboardMap[role] || '/dashboard/employee';

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header / Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {sidebarOpen || mobile ? (
          <div className="flex flex-col items-center text-center py-2">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg ring-2 ring-white dark:ring-gray-700">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {/* Name */}
            <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight">
              {user?.name || 'User'}
            </h3>
            {/* Role badge */}
            <span className="mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
              {displayRole}
            </span>
            {/* Emp ID & Department */}
            {(user?.empid || user?.usn) && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                ID: {user?.empid || user?.usn}
              </p>
            )}
            {user?.department && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate w-full">
                {user.department}
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          if (item.divider) {
            return (
              <div key={index} className="my-4 border-t border-gray-200 dark:border-gray-700">
                {(sidebarOpen || mobile) && item.label && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 mb-2 px-3 uppercase tracking-wider">
                    {item.label}
                  </p>
                )}
              </div>
            );
          }

          return (
            <Link
              key={index}
              to={item.path}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              {(sidebarOpen || mobile) && (
                <span className="font-medium">{item.label}</span>
              )}
              {item.badge && (sidebarOpen || mobile) && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all w-full"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {(sidebarOpen || mobile) && (
            <span className="font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          {(sidebarOpen || mobile) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:block bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 relative"
      >
        <SidebarContent />
        
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 z-50 md:hidden shadow-2xl"
            >
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              {/* Back + Home buttons */}
              <button
                onClick={() => navigate(-1)}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => navigate(homePath)}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                title="Go to Dashboard"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-1">
                  {title || 'WorkSphere HRMS'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {title ? 'WorkSphere HRMS' : `${displayRole} Dashboard`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email || user?.empid || user?.usn}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
