import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  Target,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { EMPLOYEE_MENU } from '../../constants/menuItems';

const EmployeePlanner = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'task', // task, meeting, project
    priority: 'medium',
    dueDate: ''
  });

  // Load from local storage for now to ensure it works without backend dependencies
  useEffect(() => {
    const savedTasks = localStorage.getItem('employee_planner_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Mock initial data
      setTasks([
        { id: 1, title: 'Team Standup', type: 'meeting', priority: 'high', dueDate: new Date().toISOString().split('T')[0], completed: false },
        { id: 2, title: 'Update HR records', type: 'task', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], completed: false },
        { id: 3, title: 'Q3 Financial Report', type: 'project', priority: 'high', dueDate: '', completed: false }
      ]);
    }
  }, []);

  const saveTasks = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem('employee_planner_tasks', JSON.stringify(newTasks));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    const addedTask = {
      id: Date.now(),
      ...newTask,
      completed: false
    };
    
    saveTasks([...tasks, addedTask]);
    setShowAddTask(false);
    setNewTask({ title: '', type: 'task', priority: 'medium', dueDate: '' });
  };

  const toggleTaskCompletion = (id) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    saveTasks(updatedTasks);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'project': return <Target className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => !t.completed && t.priority === 'high').length
  };

  return (
    <DashboardLayout 
      menuItems={EMPLOYEE_MENU} 
      role={user?.role || 'student'}
      title="Duty Roster & Planner"
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Total Tasks</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Completed</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completed}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Pending</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pending}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">High Priority</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.highPriority}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Your Duty Roster</h2>
            <button 
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">No tasks yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Add your first task to start planning your duty roster.</p>
              </div>
            ) : (
              tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1).map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${task.completed ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-700'} transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`p-1 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-green-400'}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <h4 className={`font-medium ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 capitalize">
                          {getTypeIcon(task.type)} {task.type}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" /> {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Add New Task
              </h3>
              <button 
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="What needs to be done?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="task">Task</option>
                    <option value="meeting">Meeting</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default EmployeePlanner;
