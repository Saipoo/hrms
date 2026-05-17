import express from 'express';
import AttendanceLog from '../models/AttendanceLog.js';
import Student from '../models/Student.js';
import OfficeLocation from '../models/OfficeLocation.js';
import StudentFace from '../models/StudentFace.js';
import { protect, authorize } from '../middleware/auth.js';

// Calculate Euclidean distance between two embeddings
const euclideanDistance = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    sum += Math.pow(embedding1[i] - embedding2[i], 2);
  }
  return Math.sqrt(sum);
};

const router = express.Router();

// @route   GET /api/attendance/logs
// @desc    Get attendance logs (filtered by role)
// @access  Private (Teacher, Admin)
router.get('/logs', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { subject, date, startDate, endDate, department, class: className, section } = req.query;

    // Build filter
    let filter = {};

    if (subject) filter.subject = subject;
    if (date) filter.date = date;
    if (department) filter.department = department;
    if (className) filter.class = className;
    if (section) filter.section = section;

    // Date range filter
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    const logs = await AttendanceLog.find(filter).sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance logs',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/employee/:empid
// @desc    Get attendance logs for a specific employee
// @access  Private (Employee, HR, Manager, Admin)
router.get('/employee/:empid', protect, async (req, res) => {
  try {
    const { empid } = req.params;
    console.log('📊 Fetching attendance for Employee ID:', empid);
    console.log('👤 User role:', req.userRole);
    console.log('🔗 User linkedEmpId:', req.user.linkedEmpId);

    // Authorization check
    if (req.userRole === 'student' && req.user.empid !== empid.toUpperCase()) {
      console.log('❌ Employee unauthorized');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this employee\'s attendance'
      });
    }

    if (req.userRole === 'parent' && req.user.linkedEmpId !== empid.toUpperCase()) {
      console.log('❌ HR unauthorized:', req.user.linkedEmpId, '!==', empid.toUpperCase());
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this employee\'s attendance'
      });
    }

    // Get attendance logs
    console.log('📊 Querying AttendanceLog for:', empid.toUpperCase());
    const logs = await AttendanceLog.find({ empid: empid.toUpperCase() }).sort({ date: -1, time: -1 });
    console.log('📊 Found', logs.length, 'attendance logs');

    // Calculate statistics
    const totalClasses = logs.length;
    const presentCount = logs.filter(log => log.status === 'Present').length;
    const absentCount = logs.filter(log => log.status === 'Absent').length;
    const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      empid: empid.toUpperCase(),
      statistics: {
        totalClasses,
        present: presentCount,
        absent: absentCount,
        percentage: attendancePercentage
      },
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/my-attendance
// @desc    Get attendance for logged-in employee
// @access  Private (Employee only)
router.get('/my-attendance', protect, authorize('student'), async (req, res) => {
  try {
    const empid = req.user.empid;

    // Get attendance logs
    const logs = await AttendanceLog.find({ empid: empid }).sort({ date: -1, time: -1 });

    // Calculate statistics
    const totalClasses = logs.length;
    const presentCount = logs.filter(log => log.status === 'Present').length;
    const absentCount = logs.filter(log => log.status === 'Absent').length;
    const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

    // Group by subject
    const subjectWise = {};
    logs.forEach(log => {
      if (!subjectWise[log.subject]) {
        subjectWise[log.subject] = {
          total: 0,
          present: 0,
          absent: 0
        };
      }
      subjectWise[log.subject].total++;
      if (log.status === 'Present') {
        subjectWise[log.subject].present++;
      } else {
        subjectWise[log.subject].absent++;
      }
    });

    // Calculate percentage for each subject
    Object.keys(subjectWise).forEach(subject => {
      const data = subjectWise[subject];
      data.percentage = ((data.present / data.total) * 100).toFixed(2);
    });

    res.status(200).json({
      success: true,
      statistics: {
        overall: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          percentage: attendancePercentage
        },
        subjectWise
      },
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/manual
// @desc    Manually mark attendance (Manager only)
// @access  Private (Manager only)
router.post('/manual', protect, authorize('teacher'), async (req, res) => {
  try {
    const { empid, subject, status } = req.body;

    // Validation
    if (!empid || !subject || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Employee ID, subject, and status'
      });
    }

    // Verify employee exists
    const employee = await Student.findOne({ empid: empid.toUpperCase() });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get current date and time
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    // Check if attendance already marked
    const existingAttendance = await AttendanceLog.findOne({
      empid: empid.toUpperCase(),
      subject,
      date
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this employee today'
      });
    }

    // Create attendance log
    const attendanceLog = await AttendanceLog.create({
      empid: empid.toUpperCase(),
      name: employee.name,
      subject,
      date,
      time,
      mode: 'Manual',
      status,
      department: employee.department,
      class: employee.class,
      section: employee.section,
      markedBy: `Manager: ${req.user.name}`
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('attendance_marked', {
      empid: empid.toUpperCase(),
      name: employee.name,
      subject,
      date,
      time,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendanceLog
    });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get overall attendance statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalLogs = await AttendanceLog.countDocuments();
    const presentCount = await AttendanceLog.countDocuments({ status: 'Present' });
    const absentCount = await AttendanceLog.countDocuments({ status: 'Absent' });
    const faceCount = await AttendanceLog.countDocuments({ mode: 'Face' });
    const manualCount = await AttendanceLog.countDocuments({ mode: 'Manual' });

    // Get unique employees who have marked attendance
    const uniqueEmployees = await AttendanceLog.distinct('empid');

    // Get total employees
    const totalEmployees = await Student.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalAttendanceLogs: totalLogs,
        presentCount,
        absentCount,
        faceRecognitionCount: faceCount,
        manualCount,
        uniqueEmployeesWithAttendance: uniqueEmployees.length,
        totalEmployees,
        attendancePercentage: totalLogs > 0 ? ((presentCount / totalLogs) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance log (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const attendanceLog = await AttendanceLog.findByIdAndDelete(req.params.id);

    if (!attendanceLog) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance log',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// Office Location Endpoints (HRMS Geolocation)
// ─────────────────────────────────────────────

// @route   GET /api/attendance/office-location
// @desc    Get current office location settings
// @access  Private (All authenticated users)
router.get('/office-location', protect, async (req, res) => {
  try {
    const location = await OfficeLocation.findOne().sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: location || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching office location',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/office-location
// @desc    Set / update office location (Admin only)
// @access  Private (Admin only)
router.post('/office-location', protect, authorize('admin'), async (req, res) => {
  try {
    const { latitude, longitude, radius, locationName } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Upsert — replace existing or create new
    const existing = await OfficeLocation.findOne();
    let location;

    if (existing) {
      existing.latitude = latitude;
      existing.longitude = longitude;
      if (radius) existing.radius = radius;
      if (locationName) existing.locationName = locationName;
      existing.setBy = req.user.name || 'Admin';
      existing.updatedAt = new Date();
      location = await existing.save();
    } else {
      location = await OfficeLocation.create({
        latitude,
        longitude,
        radius: radius || 100,
        locationName: locationName || 'Company Office',
        setBy: req.user.name || 'Admin'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Office location updated successfully',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating office location',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/mark
// @desc    Mark attendance (Biometric or Remote)
// @access  Private (Student)
router.post('/mark', protect, authorize('student'), async (req, res) => {
  try {
    const { empid, subject, mode, status, latitude, longitude, locationVerified, sessionType, descriptor } = req.body;

    // Check if attendance already marked today
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const existing = await AttendanceLog.findOne({
      empid: empid.toUpperCase(),
      subject,
      date
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session today'
      });
    }

    // Biometric Verification (if applicable)
    if (mode === 'Face Recognition') {
      if (!descriptor || !Array.isArray(descriptor)) {
        return res.status(400).json({
          success: false,
          message: 'Face embedding is required for biometric verification'
        });
      }

      const studentFace = await StudentFace.findOne({ empid: empid.toUpperCase() });
      if (!studentFace) {
        return res.status(404).json({
          success: false,
          message: 'No registered face found for this Employee ID. Please register first.'
        });
      }

      // Check against stored embeddings
      let minDistance = Infinity;
      const threshold = 0.6; // Standard face-api.js threshold for 'same person'

      for (const storedEmbedding of studentFace.embeddings) {
        const distance = euclideanDistance(descriptor, storedEmbedding);
        if (distance < minDistance) minDistance = distance;
      }

      if (minDistance > threshold) {
        return res.status(401).json({
          success: false,
          message: 'Face verification failed. Please ensure you are looking at the camera clearly.',
          confidence: (1 - minDistance).toFixed(2)
        });
      }
      
      console.log(`✅ Biometric match for ${empid} (Distance: ${minDistance.toFixed(3)})`);
    }

    // Create log
    const log = await AttendanceLog.create({
      empid: empid.toUpperCase(),
      name: req.user.name,
      subject,
      date,
      time: now.toTimeString().split(' ')[0],
      mode,
      status: status || 'Present',
      latitude,
      longitude,
      locationVerified,
      sessionType,
      department: req.user.department,
      class: req.user.class,
      section: req.user.section,
      markedBy: `Employee: ${req.user.name}`
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_marked', log);
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: log
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

export default router;
