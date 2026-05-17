import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import StudentConfession from '../models/StudentConfession.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';

// Dynamic Gemini AI Client getter to handle ES6 module load timing differences
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

// Encryption utilities
// AES-256 requires a 32-byte key
const IV_LENGTH = 16;

// A stable, hardcoded backup key so server restarts never break decryption even if .env is missing
const BACKUP_KEY = 'WorkSphereHRMSPrivateSecretKey32';

/**
 * Get properly formatted encryption key (32 bytes)
 */
function getEncryptionKey() {
  const keyStr = process.env.ENCRYPTION_KEY || BACKUP_KEY;
  // If ENCRYPTION_KEY is 32 chars, pad it to 32 bytes
  // If it's longer, hash it to get exactly 32 bytes
  if (keyStr.length === 32) {
    // Already 32 bytes if ASCII
    return Buffer.from(keyStr, 'utf8');
  } else if (keyStr.length === 64) {
    // It's a hex string representing 32 bytes
    return Buffer.from(keyStr, 'hex');
  } else {
    // Hash it to get exactly 32 bytes
    return crypto.createHash('sha256').update(keyStr).digest();
  }
}

/**
 * Encrypt confession content
 */
function encryptContent(text) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted content
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    console.error('Key length:', ENCRYPTION_KEY?.length);
    throw new Error('Failed to encrypt content');
  }
}

/**
 * Decrypt confession content
 */
function decryptContent(encryptedText) {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt content');
  }
}

/**
 * Create content hash for integrity
 */
function createContentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Analyze sentiment and severity using Gemini AI
 */
async function analyzeSentiment(content) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Analyze the following employee concern/complaint and provide:
1. Primary sentiment (choose one: Neutral, Sadness, Anger, Stress, Anxiety, Fear, Frustration, Hope, Gratitude)
2. Sentiment score (0-1, where 0 is very negative and 1 is very positive)
3. Severity level (Low, Medium, High, Critical)
4. Severity score (0-10, where 10 is most severe/urgent)
5. Brief summary (1-2 sentences)
6. Recommendation for handling (1-2 sentences)

Employee's message:
"""
${content}
"""

Respond in JSON format:
{
  "sentiment": "...",
  "sentimentScore": 0.0,
  "severity": "...",
  "severityScore": 0,
  "summary": "...",
  "recommendation": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return {
      sentiment: 'Neutral',
      sentimentScore: 0.5,
      severity: 'Medium',
      severityScore: 5,
      summary: 'Employee has raised a concern that requires attention.',
      recommendation: 'Review the concern and provide appropriate support.'
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // Return default values on error
    return {
      sentiment: 'Neutral',
      sentimentScore: 0.5,
      severity: 'Medium',
      severityScore: 5,
      summary: 'Unable to analyze sentiment automatically.',
      recommendation: 'Manual review recommended.'
    };
  }
}

/**
 * Generate empathetic AI response for student
 */
async function generateEmpatheticResponse(content, category) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a compassionate HR specialist or corporate counselor for employees. An employee has shared the following concern:

"""
${content}
"""

Provide a warm, empathetic, and supportive response (3-4 sentences) that:
1. Acknowledges their feelings
2. Validates their concerns
3. Offers hope and reassurance
4. Encourages them to submit so appropriate help can be provided

Keep the tone gentle, understanding, and professional. Do not make promises about specific actions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI response generation error:', error);
    return "Thank you for sharing this with us. Your feelings and concerns are valid, and we want you to know that you're not alone. By submitting this, you're taking an important step toward finding support. Our team will review this carefully and work to help you through this situation.";
  }
}

/**
 * Create a new confession
 */
async function createConfession(confessionData) {
  try {
    const { studentId, category, content, visibility, shareWithParent, subcategory } = confessionData;
    
    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Encrypt the content
    const encryptedContent = encryptContent(content);
    const contentHash = createContentHash(content);
    
    // Analyze sentiment and severity
    const analysis = await analyzeSentiment(content);
    
    // Create confession
    const confession = new StudentConfession({
      studentId,
      studentName: student.name,
      studentUSN: student.usn || student.email.split('@')[0],
      category,
      subcategory,
      content: encryptedContent,
      contentHash,
      visibility: visibility || 'Anonymous',
      shareWithParent: shareWithParent || false,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      severity: analysis.severity,
      severityScore: analysis.severityScore,
      aiSummary: analysis.summary,
      aiRecommendation: analysis.recommendation
    });
    
    // Set priority based on severity
    if (analysis.severityScore >= 8) {
      confession.priority = 'Urgent';
    } else if (analysis.severityScore >= 5) {
      confession.priority = 'High';
    }
    
    await confession.save();
    
    console.log(`✅ Confession created: ${confession.confessionId} - Severity: ${confession.severity}`);
    
    return confession;
  } catch (error) {
    console.error('Error creating confession:', error);
    throw error;
  }
}

/**
 * Get confessions for a user based on their role
 */
async function getConfessionsByRole(userId, userRole, filters = {}) {
  try {
    const confessions = await StudentConfession.getByRole(userId, userRole, filters);
    
    // Decrypt content for authorized users
    const decryptedConfessions = confessions.map(confession => {
      const confObj = confession.toObject();
      
      try {
        confObj.content = decryptContent(confObj.content);
      } catch (error) {
        console.error('Decryption error for confession:', confession.confessionId);
        confObj.content = '[Content unavailable]';
      }
      
      // Anonymize if needed
      if (confession.visibility === 'Anonymous' && userRole === 'teacher') {
        confObj.studentName = 'Anonymous Student';
        confObj.studentUSN = '****';
        confObj.studentId = null;
      }
      
      return confObj;
    });
    
    return decryptedConfessions;
  } catch (error) {
    console.error('Error fetching confessions:', error);
    throw error;
  }
}

/**
 * Get a single confession by ID
 */
async function getConfessionById(confessionId, userId, userRole) {
  try {
    const confession = await StudentConfession.findOne({ confessionId })
      .populate('studentId', 'name email usn')
      .populate('assignedTo.userId', 'name email role')
      .populate('assignedTo.assignedBy', 'name')
      .populate('flaggedBy', 'name')
      .populate('adminNotes.addedBy', 'name');
    
    if (!confession) {
      throw new Error('Confession not found');
    }
    
    // Check authorization
    // - Admin can view any confession
    // - Student can view their own confession
    // - Teacher can view if: assigned to them OR confession is Identified (not Anonymous)
    // - Parent can view if confession is shared with parents
    const isAuthorized = 
      userRole === 'admin' ||
      (userRole === 'student' && confession.studentId._id.toString() === userId.toString()) ||
      (userRole === 'teacher' && (
        confession.assignedTo.some(a => a.userId._id.toString() === userId.toString()) ||
        confession.visibility === 'Identified'
      )) ||
      (userRole === 'parent' && confession.shareWithParent);
    
    if (!isAuthorized) {
      throw new Error('Not authorized to view this confession');
    }
    
    // Increment view count
    confession.viewCount += 1;
    await confession.save();
    
    // Decrypt content
    const confObj = confession.toObject();
    confObj.content = decryptContent(confObj.content);
    
    // Anonymize if needed
    if (confession.visibility === 'Anonymous' && userRole === 'teacher') {
      confObj.studentName = 'Anonymous Student';
      confObj.studentUSN = '****';
      confObj.studentId = null;
    }
    
    return confObj;
  } catch (error) {
    console.error('Error fetching confession:', error);
    throw error;
  }
}

/**
 * Update confession status
 */
async function updateConfessionStatus(confessionId, status, userId, userRole) {
  try {
    // Try to find by MongoDB _id first, then by confessionId field
    let confession;
    try {
      confession = await StudentConfession.findById(confessionId);
    } catch (err) {
      // If findById fails (invalid ObjectId format), try findOne with confessionId field
      confession = await StudentConfession.findOne({ confessionId });
    }
    
    if (!confession) {
      throw new Error('Confession not found');
    }
    
    // Authorization logic:
    // - Admin can update any confession
    // - Teacher can update if: assigned to them OR confession is Identified (not Anonymous)
    // - Student cannot update (only submit)
    const isAuthorized = 
      userRole === 'admin' ||
      (userRole === 'teacher' && (
        confession.assignedTo.some(a => a.userId.toString() === userId.toString()) ||
        confession.visibility === 'Identified'
      ));
    
    if (!isAuthorized) {
      throw new Error('Not authorized to update this confession');
    }
    
    confession.status = status;
    
    // Update timestamps based on status
    if (status === 'Acknowledged' && !confession.acknowledgedAt) {
      confession.acknowledgedAt = new Date();
    }
    if (status === 'Resolved' && !confession.resolvedAt) {
      confession.resolvedAt = new Date();
    }
    
    await confession.save();
    
    console.log(`✅ Confession ${confessionId} status updated to: ${status}`);
    
    return confession;
  } catch (error) {
    console.error('Error updating confession status:', error);
    throw error;
  }
}

/**
 * Add response to confession
 */
async function addResponse(confessionId, responseData, userId, userRole) {
  try {
    // Try to find by MongoDB _id first, then by confessionId field
    let confession;
    try {
      confession = await StudentConfession.findById(confessionId);
    } catch (err) {
      // If findById fails (invalid ObjectId format), try findOne with confessionId field
      confession = await StudentConfession.findOne({ confessionId });
    }
    
    if (!confession) {
      throw new Error('Confession not found');
    }
    
    // Authorization logic:
    // - Admin can respond to any confession
    // - Teacher can respond if: assigned to them OR confession is Identified (not Anonymous)
    const isAuthorized = 
      userRole === 'admin' ||
      (userRole === 'teacher' && (
        confession.assignedTo.some(a => a.userId.toString() === userId.toString()) ||
        confession.visibility === 'Identified'
      ));
    
    if (!isAuthorized) {
      throw new Error('Not authorized to respond to this confession');
    }
    
    await confession.addResponse({
      from: userRole === 'admin' ? 'Admin' : 'Teacher',
      userId,
      userModel: userRole === 'admin' ? 'Admin' : 'Teacher',
      message: responseData.message,
      isPrivate: responseData.isPrivate || false
    });
    
    // Update status if it's still pending
    if (confession.status === 'Pending') {
      confession.status = 'Acknowledged';
      await confession.save();
    }
    
    console.log(`✅ Response added to confession ${confessionId}`);
    
    return confession;
  } catch (error) {
    console.error('Error adding response:', error);
    throw error;
  }
}

/**
 * Assign confession to teacher/counselor
 */
async function assignConfession(confessionId, targetUserId, role, assignedByUserId) {
  try {
    // Try to find by MongoDB _id first, then by confessionId field
    let confession;
    try {
      confession = await StudentConfession.findById(confessionId);
    } catch (err) {
      // If findById fails (invalid ObjectId format), try findOne with confessionId field
      confession = await StudentConfession.findOne({ confessionId });
    }
    
    if (!confession) {
      throw new Error('Confession not found');
    }
    
    await confession.assignTo(targetUserId, role, assignedByUserId);
    
    console.log(`✅ Confession ${confession.confessionId} assigned to ${role}`);
    
    return confession;
  } catch (error) {
    console.error('Error assigning confession:', error);
    throw error;
  }
}

/**
 * Flag confession
 */
async function flagConfession(confessionId, userId, reason) {
  try {
    // Try to find by MongoDB _id first, then by confessionId field
    let confession;
    try {
      confession = await StudentConfession.findById(confessionId);
    } catch (err) {
      // If findById fails (invalid ObjectId format), try findOne with confessionId field
      confession = await StudentConfession.findOne({ confessionId });
    }
    
    if (!confession) {
      throw new Error('Confession not found');
    }
    
    confession.isFlagged = true;
    confession.flaggedBy = userId;
    confession.flagReason = reason;
    confession.priority = 'Urgent';
    
    await confession.save();
    
    console.log(`🚩 Confession ${confessionId} flagged`);
    
    return confession;
  } catch (error) {
    console.error('Error flagging confession:', error);
    throw error;
  }
}

/**
 * Get confession analytics
 */
async function getAnalytics(filters = {}) {
  try {
    let matchStage = { isActive: true, isDeleted: false };
    
    if (filters.startDate || filters.endDate) {
      matchStage.submittedAt = {};
      if (filters.startDate) matchStage.submittedAt.$gte = new Date(filters.startDate);
      if (filters.endDate) matchStage.submittedAt.$lte = new Date(filters.endDate);
    }
    
    const analytics = await StudentConfession.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          bySentiment: [
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
          ],
          averageResolutionTime: [
            { $match: { status: 'Resolved', resolvedAt: { $exists: true } } },
            {
              $project: {
                resolutionTime: {
                  $divide: [
                    { $subtract: ['$resolvedAt', '$submittedAt'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                }
              }
            },
            { $group: { _id: null, avgDays: { $avg: '$resolutionTime' } } }
          ],
          trendByWeek: [
            {
              $group: {
                _id: {
                  week: { $week: '$submittedAt' },
                  year: { $year: '$submittedAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.week': 1 } },
            { $limit: 12 }
          ]
        }
      }
    ]);
    
    return {
      totalConfessions: analytics[0].totalCount[0]?.count || 0,
      byCategory: analytics[0].byCategory,
      byStatus: analytics[0].byStatus,
      bySeverity: analytics[0].bySeverity,
      bySentiment: analytics[0].bySentiment,
      averageResolutionDays: analytics[0].averageResolutionTime[0]?.avgDays || 0,
      trendByWeek: analytics[0].trendByWeek
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

/**
 * Get emotional health summary for a student (for parents)
 */
async function getEmotionalHealthSummary(studentId) {
  try {
    const confessions = await StudentConfession.find({
      studentId,
      isActive: true,
      isDeleted: false,
      submittedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ submittedAt: -1 });
    
    if (confessions.length === 0) {
      return {
        summary: 'No recent concerns reported. Your child appears to be doing well.',
        sentiment: 'Positive',
        confessionCount: 0,
        recommendations: []
      };
    }
    
    // Calculate average sentiment score
    const avgSentiment = confessions.reduce((sum, c) => sum + (c.sentimentScore || 0.5), 0) / confessions.length;
    
    // Determine overall sentiment
    let overallSentiment = 'Neutral';
    if (avgSentiment > 0.6) overallSentiment = 'Positive';
    else if (avgSentiment < 0.4) overallSentiment = 'Needs Attention';
    
    // Generate AI summary
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Based on ${confessions.length} recent concerns from a student, generate a brief emotional health summary for parents (2-3 sentences). The average sentiment score is ${avgSentiment.toFixed(2)} (0-1 scale). Categories of concerns: ${confessions.map(c => c.category).join(', ')}. Be supportive, honest, and provide general guidance without specific details.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiSummary = response.text();
    
    return {
      summary: aiSummary,
      sentiment: overallSentiment,
      confessionCount: confessions.length,
      recommendations: [
        'Maintain open communication with your child',
        'Check in regularly about their well-being',
        'Consider scheduling a meeting with their counselor'
      ]
    };
  } catch (error) {
    console.error('Error generating emotional health summary:', error);
    return {
      summary: 'Unable to generate summary at this time.',
      sentiment: 'Unknown',
      confessionCount: 0,
      recommendations: []
    };
  }
}

export {
  encryptContent,
  decryptContent,
  createContentHash,
  analyzeSentiment,
  generateEmpatheticResponse,
  createConfession,
  getConfessionsByRole,
  getConfessionById,
  updateConfessionStatus,
  addResponse,
  assignConfession,
  flagConfession,
  getAnalytics,
  getEmotionalHealthSummary
};

export default {
  encryptContent,
  decryptContent,
  createContentHash,
  analyzeSentiment,
  generateEmpatheticResponse,
  createConfession,
  getConfessionsByRole,
  getConfessionById,
  updateConfessionStatus,
  addResponse,
  assignConfession,
  flagConfession,
  getAnalytics,
  getEmotionalHealthSummary
};
