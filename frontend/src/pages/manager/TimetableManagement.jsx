import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Save,
  X,
  Clock,
  BookOpen,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';


const TimetableManagement = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    class: '',
    section: '',
    department: '',
    day: 'Monday',
    startTime: '',
    endTime: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await api.get('/timetable/my-schedule');
      if (response.data.success) {
        setTimetable(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.subject || !formData.class || !formData.section || !formData.department || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingEntry) {
        // Update existing entry
        const response = await api.put(`/timetable/${editingEntry._id}`, formData);
        if (response.data.success) {
          toast.success('Timetable entry updated successfully');
          fetchTimetable();
        }
      } else {
        // Create new entry
        const response = await api.post('/timetable/upload', formData);
        if (response.data.success) {
          toast.success('Timetable entry added successfully');
          fetchTimetable();
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error(error.response?.data?.message || 'Failed to save timetable entry');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      subject: entry.subject,
      class: entry.class,
      section: entry.section,
      department: entry.department,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await api.delete(`/timetable/${id}`);
      if (response.data.success) {
        toast.success('Timetable entry deleted successfully');
        fetchTimetable();
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);
      toast.error('Failed to delete timetable entry');
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      class: '',
      section: '',
      department: '',
      day: 'Monday',
      startTime: '',
      endTime: ''
    });
    setEditingEntry(null);
    setShowModal(false);
  };

  const exportToCSV = () => {
    const headers = ['Day', 'Subject', 'Class', 'Section', 'Department', 'Start Time', 'End Time'];
    const rows = timetable.map(entry => [
      entry.day,
      entry.subject,
      entry.class,
      entry.section,
      entry.department,
      entry.startTime,
      entry.endTime
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Timetable exported to CSV');
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/timetable/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        toast.success('Bulk upload successful');
        fetchTimetable();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    }
  };

  const getDaySchedule = (day) => {
    return timetable.filter(entry => entry.day === day).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title="Shift Schedule Management" 
        subtitle="Manage your shift schedule and timetable entries" 
        icon={Calendar} 
      />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end mb-8 mt-4">
          <div className="flex gap-3">
            <label className="btn btn-secondary cursor-pointer flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="hidden"
              />
            </label>
            <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Weekly View */}
        <div className="grid grid-cols-1 gap-6">
          {days.map((day) => {
            const daySchedule = getDaySchedule(day);
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  {day}
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {daySchedule.length} {daySchedule.length === 1 ? 'shift' : 'shifts'}
                  </span>
                </h2>
                {daySchedule.length > 0 ? (
                  <div className="space-y-3">
                    {daySchedule.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                            <h3 className="font-semibold text-lg">{entry.subject}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{entry.class} • {entry.section}</span>
                            </div>
                            <span>|</span>
                            <span>{entry.department}</span>
                            <span>|</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{entry.startTime} - {entry.endTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No shifts scheduled for {day}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Shift Type / Task</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Shift / Task</option>
                    {user?.subjects?.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team / Designation</label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Development Team, Senior Lead"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Work Location / Zone</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Floor 3, Remote/WFH"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="input-field"
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <select
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    {editingEntry ? 'Update' : 'Save'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableManagement;
