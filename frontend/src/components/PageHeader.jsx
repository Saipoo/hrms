import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * PageHeader – Universal header shown on all sub-pages.
 * Provides:
 *   • ← Back  (navigate(-1))
 *   • 🏠 Home  (navigate to role dashboard)
 *   • WorkSphere HRMS branding
 */
const roleDashboardMap = {
  student: '/dashboard/employee',
  teacher: '/dashboard/manager',
  parent:  '/dashboard/hr',
  admin:   '/dashboard/admin'
};

const roleDisplayMap = {
  student: 'Employee Portal',
  teacher: 'Manager Portal',
  parent:  'HR Portal',
  admin:   'Admin Panel'
};

const PageHeader = ({ title, subtitle, icon: Icon }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role || 'student';
  const homePath = roleDashboardMap[role] || '/dashboard/student';
  const portalLabel = roleDisplayMap[role] || 'Employee Portal';

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Back + Home */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Go to Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        {/* Center: Page title */}
        <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
          {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          {title && (
            <div className="text-center">
              <h1 className="text-base font-semibold text-gray-800 dark:text-white leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Branding */}
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="hidden sm:block text-right">
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WorkSphere HRMS
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500">{portalLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
