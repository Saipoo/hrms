import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  UserCircle, 
  ScanFace, 
  Eye, 
  EyeOff,
  Building,
  BookOpen,
  Hash,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student fields
    empid: '',
    department: '',
    designation: '',
    team: '',
    // Teacher fields
    projects: '',
    // Parent fields
    linkedEmpId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.empid || !formData.department || !formData.designation || !formData.team) {
        toast.error('Please fill all employee fields!');
        return;
      }
    }

    if (formData.role === 'teacher') {
      if (!formData.empid || !formData.department || !formData.projects) {
        toast.error('Please fill all manager fields!');
        return;
      }
    }

    if (formData.role === 'parent') {
      if (!formData.empid || !formData.department || !formData.linkedEmpId) {
        toast.error('Please provide EmpID, Department, and Linked Employee ID!');
        return;
      }
    }

    setLoading(true);
    await register(formData);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Logo and Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <ScanFace className="w-12 h-12 text-primary-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              WorkSphere HRMS
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Join WorkSphere HRMS and transform your enterprise
          </p>
        </div>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Register As *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field pl-10 appearance-none"
              >
                <option value="student">👨‍💼 Employee</option>
                <option value="teacher">👩‍💼 Manager</option>
                <option value="parent">🧑‍🤝‍🧑 HR</option>
                <option value="admin">⚙️ Admin</option>
              </select>
            </div>
          </div>

          {/* Role-Specific Fields */}
          {formData.role === 'student' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-4">
                  Employee Information
                </h3>
              </div>

              <div>
                <label htmlFor="empid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  EmpID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="empid"
                    name="empid"
                    type="text"
                    required={formData.role === 'student'}
                    value={formData.empid}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="EMP001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required={formData.role === 'student'}
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Designation *
                </label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  required={formData.role === 'student'}
                  value={formData.designation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team *
                </label>
                <input
                  id="team"
                  name="team"
                  type="text"
                  required={formData.role === 'student'}
                  value={formData.team}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Frontend"
                />
              </div>
            </motion.div>
          )}

          {formData.role === 'teacher' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
            >
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Manager Information
              </h3>

              <div>
                <label htmlFor="empid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  EmpID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="empid"
                    name="empid"
                    type="text"
                    required={formData.role === 'teacher'}
                    value={formData.empid}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="MGR001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required={formData.role === 'teacher'}
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="projects" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Projects (comma-separated) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="projects"
                    name="projects"
                    type="text"
                    required={formData.role === 'teacher'}
                    value={formData.projects}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Project Alpha, Project Beta"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {formData.role === 'parent' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                HR Information
              </h3>

              <div>
                <label htmlFor="empid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your EmpID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="empid"
                    name="empid"
                    type="text"
                    required={formData.role === 'parent'}
                    value={formData.empid}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="HR001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required={formData.role === 'parent'}
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="linkedEmpId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Linked Employee ID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="linkedEmpId"
                    name="linkedEmpId"
                    type="text"
                    required={formData.role === 'parent'}
                    value={formData.linkedEmpId}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="EMP001"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter an employee's ID from your department to link accounts
                </p>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
