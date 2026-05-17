import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Student/Teacher/Parent/Admin)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, ...additionalData } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;

    switch (role.toLowerCase()) {
      case 'student':
        // Check if student already exists
        const existingStudent = await Student.findOne({ 
          $or: [{ email }, { empid: additionalData.empid }] 
        });
        
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Employee with this email or EmpID already exists'
          });
        }

        // Validate student-specific fields
        if (!additionalData.empid || !additionalData.department || !additionalData.designation || !additionalData.team) {
          return res.status(400).json({
            success: false,
            message: 'Please provide EmpID, Department, Designation, and Team'
          });
        }

        newUser = await Student.create({
          name,
          email,
          password: hashedPassword,
          empid: additionalData.empid.toUpperCase(),
          department: additionalData.department,
          designation: additionalData.designation,
          team: additionalData.team.toUpperCase()
        });
        break;

      case 'teacher':
        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ 
          $or: [{ email }, { empid: additionalData.empid }] 
        });
        
        if (existingTeacher) {
          return res.status(400).json({
            success: false,
            message: 'Manager with this email or EmpID already exists'
          });
        }

        // Validate teacher-specific fields
        if (!additionalData.empid || !additionalData.department || !additionalData.projects) {
          return res.status(400).json({
            success: false,
            message: 'Please provide EmpID, Department, and Projects'
          });
        }

        // Convert subjects to array if it's a string
        let projectsArray = additionalData.projects;
        if (typeof additionalData.projects === 'string') {
          projectsArray = additionalData.projects.split(',').map(s => s.trim());
        }

        newUser = await Teacher.create({
          name,
          email,
          password: hashedPassword,
          empid: additionalData.empid.toUpperCase(),
          department: additionalData.department,
          projects: projectsArray
        });
        break;

      case 'parent':
        // Check if parent already exists
        const existingParent = await Parent.findOne({ 
          $or: [{ email }, { empid: additionalData.empid }] 
        });
        
        if (existingParent) {
          return res.status(400).json({
            success: false,
            message: 'HR with this email or EmpID already exists'
          });
        }

        // Validate parent-specific fields
        if (!additionalData.empid || !additionalData.department || !additionalData.linkedEmpId) {
          return res.status(400).json({
            success: false,
            message: 'Please provide EmpID, Department, and Linked Employee ID'
          });
        }

        // Verify that the student USN exists and is in the same department
        const linkedStudent = await Student.findOne({ 
          empid: additionalData.linkedEmpId.toUpperCase(),
          department: additionalData.department
        });

        if (!linkedStudent) {
          return res.status(400).json({
            success: false,
            message: 'Employee with provided EmpID in your Department does not exist'
          });
        }

        newUser = await Parent.create({
          name,
          email,
          password: hashedPassword,
          empid: additionalData.empid.toUpperCase(),
          department: additionalData.department,
          linkedEmpId: additionalData.linkedEmpId.toUpperCase()
        });
        break;

      case 'admin':
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        
        if (existingAdmin) {
          return res.status(400).json({
            success: false,
            message: 'Admin with this email already exists'
          });
        }

        newUser = await Admin.create({
          name,
          email,
          password: hashedPassword
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be student, teacher, parent, or admin'
        });
    }

    // Generate token
    const token = generateToken(newUser._id, role.toLowerCase());

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: role.toLowerCase(),
        ...(role.toLowerCase() === 'student' && { 
          empid: newUser.empid, 
          department: newUser.department,
          designation: newUser.designation,
          team: newUser.team
        }),
        ...(role.toLowerCase() === 'teacher' && { 
          empid: newUser.empid,
          department: newUser.department,
          projects: newUser.projects
        }),
        ...(role.toLowerCase() === 'parent' && { 
          empid: newUser.empid,
          department: newUser.department,
          linkedEmpId: newUser.linkedEmpId
        })
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role'
      });
    }

    let user;
    let userModel;

    // Find user based on role
    switch (role.toLowerCase()) {
      case 'student':
        user = await Student.findOne({ email }).select('+password');
        userModel = 'Student';
        break;
      case 'teacher':
        user = await Teacher.findOne({ email }).select('+password');
        userModel = 'Teacher';
        break;
      case 'parent':
        user = await Parent.findOne({ email }).select('+password');
        userModel = 'Parent';
        break;
      case 'admin':
        user = await Admin.findOne({ email }).select('+password');
        userModel = 'Admin';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, role.toLowerCase());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role.toLowerCase(),
        profilePhoto: user.profilePhoto,
        ...(role.toLowerCase() === 'student' && { 
          empid: user.empid, 
          department: user.department,
          designation: user.designation,
          team: user.team
        }),
        ...(role.toLowerCase() === 'teacher' && { 
          empid: user.empid,
          department: user.department,
          projects: user.projects
        }),
        ...(role.toLowerCase() === 'parent' && { 
          empid: user.empid,
          department: user.department,
          linkedEmpId: user.linkedEmpId
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (Name, Email, Photo)
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email, profilePhoto } = req.body;
    const userRole = req.user.role.toLowerCase();
    
    let Model;
    if (userRole === 'student') Model = Student;
    else if (userRole === 'teacher') Model = Teacher;
    else if (userRole === 'parent') Model = Parent;
    else return res.status(400).json({ success: false, message: 'Invalid role' });

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const emailExists = await Model.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    if (profilePhoto !== undefined) updatedFields.profilePhoto = profilePhoto;

    const updatedUser = await Model.findByIdAndUpdate(
      req.user._id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePhoto: updatedUser.profilePhoto,
        ...(userRole === 'student' && { 
          empid: updatedUser.empid, 
          department: updatedUser.department,
          designation: updatedUser.designation,
          team: updatedUser.team
        }),
        ...(userRole === 'teacher' && { 
          empid: updatedUser.empid,
          department: updatedUser.department,
          projects: updatedUser.projects
        }),
        ...(userRole === 'parent' && { 
          empid: updatedUser.empid,
          department: updatedUser.department,
          linkedEmpId: updatedUser.linkedEmpId
        })
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

export default router;
