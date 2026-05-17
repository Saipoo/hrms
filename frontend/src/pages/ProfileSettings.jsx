import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, Building, Hash, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePhoto: user?.profilePhoto || ''
  });
  
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(formData);
    setLoading(false);
    if (result.success) {
      toast.success('Profile updated successfully!');
    }
  };

  const getRoleSpecificInfo = () => {
    if (user?.role === 'student') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Hash className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">EmpID</p>
              <p className="text-sm font-semibold">{user.empid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Building className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Department</p>
              <p className="text-sm font-semibold">{user.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Briefcase className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Designation</p>
              <p className="text-sm font-semibold">{user.designation}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Team</p>
              <p className="text-sm font-semibold">{user.team}</p>
            </div>
          </div>
        </div>
      );
    }
    // Handle Manager (Teacher)
    if (user?.role === 'teacher') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Hash className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">EmpID</p>
              <p className="text-sm font-semibold">{user.empid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Building className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Department</p>
              <p className="text-sm font-semibold">{user.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Briefcase className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Projects</p>
              <p className="text-sm font-semibold">{user.projects?.join(', ')}</p>
            </div>
          </div>
        </div>
      );
    }
    // Handle HR (Parent)
    if (user?.role === 'parent') {
       return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Hash className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">EmpID</p>
              <p className="text-sm font-semibold">{user.empid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Building className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider">Department</p>
              <p className="text-sm font-semibold">{user.department}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <PageHeader 
        title="Profile Settings" 
        subtitle="Manage your personal information and profile picture"
        icon={User}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex flex-col items-center mb-10">
              <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900/30 group-hover:opacity-75 transition-opacity bg-gray-100 dark:bg-gray-700">
                  {formData.profilePhoto ? (
                    <img 
                      src={formData.profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg transform group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Click to update profile photo
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest">
                  HRMS Details (View-only)
                </h3>
                {getRoleSpecificInfo()}
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Update Profile
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
