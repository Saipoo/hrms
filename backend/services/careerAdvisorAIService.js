import AIService from './AIService.js';

class CareerAdvisorAIService {
  /**
   * Analyze employee profile and recommend career growth paths
   */
  async analyzeCareerPaths(employeeData) {
    try {
      const {
        performanceKpis,
        completedTraining = [],
        experience = [],
        interests = [],
        currentSkills = []
      } = employeeData || {};

      const prompt = `
You are an AI Executive Career Coach. Analyze this employee's profile and recommend top 5 internal growth or professional career paths.

Employee Profile:
Performance KPIs:
- Overall Rating: ${performanceKpis?.overallRating || 'N/A'}
- Strengths: ${performanceKpis?.strengths?.join(', ') || 'N/A'}
- Improvement Areas: ${performanceKpis?.improvementAreas?.join(', ') || 'N/A'}

Completed Training:
${(completedTraining || []).map(t => `- ${t.title} (${t.category})`).join('\n') || 'None'}

Professional Experience:
${(experience || []).map(e => `- ${e.title} at ${e.company} (${e.duration})`).join('\n') || 'None'}

Interests:
${(interests || []).map(i => `- ${i.area} (${i.level} interest)`).join('\n') || 'Not specified'}

Current Skills:
${(currentSkills || []).map(s => `- ${s.name} (${s.level})`).join('\n') || 'None listed'}

Recommend 5 career paths with match score (0-100). Include title, description, required skills, average salary range (INR), top companies/departments, and reasoning.

Return JSON array of objects with "path" and "matchScore" and "reasoning".
`;

      const recommendations = await AIService.generateContent(prompt);
      
      return {
        success: true,
        recommendations: (recommendations || []).map(rec => ({ ...rec, generatedAt: new Date() })),
        analyzedAt: new Date()
      };
    } catch (error) {
      console.error('Error analyzing career paths:', error);
      return { success: false, message: 'Failed to analyze career paths' };
    }
  }

  /**
   * Analyze skill gaps for chosen career path
   */
  async analyzeSkillGaps(currentProfile, targetCareerPath) {
    try {
      const { currentSkills = [], completedTraining = [] } = currentProfile || {};
      const { requiredSkills = [], title = 'Target Career' } = targetCareerPath || {};

      const prompt = `
Analyze skill gaps for an employee targeting "${title}".
Current Skills: ${(currentSkills || []).map(s => s.name).join(', ')}
Target Skills: ${(requiredSkills || []).join(', ')}

Identify missing skills, priority, and suggested corporate training resources.
Return JSON array of objects.
`;

      const skillGaps = await AIService.generateContent(prompt);
      
      return { success: true, skillGaps, analyzedAt: new Date() };
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      return { success: false, message: 'Failed to analyze skill gaps' };
    }
  }

  /**
   * Generate/Edit AI-powered resume
   */
  async generateResume(employeeProfile) {
    try {
      const prompt = `
Create a professional, ATS-optimized executive resume for:
${JSON.stringify(employeeProfile)}

Include professional summary, experience with impact metrics, project descriptions, and skill categorization.
Return JSON object with "summary", "sections" (education, experience, projects, certifications, skills), and "tips".
`;

      const resume = await AIService.generateContent(prompt);
      
      return {
        success: true,
        resume: { ...resume, aiGenerated: true, lastGenerated: new Date() },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating resume:', error);
      return { success: false, message: 'Failed to generate resume' };
    }
  }

  /**
   * Optimize existing resume based on job description
   */
  async optimizeResume(resumeContent, jobDescription) {
    try {
      const prompt = `
Optimize this resume for the following job description:
RESUME: ${JSON.stringify(resumeContent)}
JOB DESCRIPTION: ${jobDescription}

Provide:
1. ATS Score (0-100)
2. Missing keywords
3. Content improvements
4. Optimized resume content

Return JSON: { "atsScore": number, "suggestions": { "keywords": [], "content": [] }, "optimizedResume": {} }
`;

      const results = await AIService.generateContent(prompt);
      return { success: true, data: results };
    } catch (error) {
      console.error('Error optimizing resume:', error);
      return { success: false, message: 'Failed to optimize resume' };
    }
  }

  /**
   * Parse existing resume text/content into structured data
   */
  async parseResume(fileContent, fileType) {
    try {
      const prompt = `
Parse this ${fileType} resume content into a structured JSON format.
CONTENT: ${fileContent}

Extract:
- Professional Summary
- Education (array of objects)
- Experience (array of objects)
- Projects (array of objects)
- Technical Skills (array)
- Certifications (array)

Return JSON object: { "summary": "", "education": [], "experience": [], "projects": [], "skills": { "technical": [] }, "certifications": [] }
`;

      const parsedData = await AIService.generateContent(prompt);
      return { success: true, data: parsedData };
    } catch (error) {
      console.error('Error parsing resume:', error);
      return { success: false, message: 'Failed to parse resume content' };
    }
  }

  /**
   * Calculate career readiness score
   */
  async calculateReadinessScore(profile, targetPath) {
    try {
      const prompt = `
Calculate a "Professional Readiness Score" (0-100) for this employee targeting "${targetPath}".
Profile: ${JSON.stringify(profile)}

Return JSON: { "score": number, "breakdown": { "skills": number, "experience": number, "training": number }, "recommendations": [] }
`;
      return await AIService.generateContent(prompt);
    } catch (error) {
      console.error('Error calculating readiness score:', error);
      return { score: 50, breakdown: {}, recommendations: [] };
    }
  }

  /**
   * Generate career roadmap
   */
  async generateCareerRoadmap(profile, targetPath) {
    try {
      const prompt = `
Generate a 12-month professional career roadmap for an employee transitioning to "${targetPath}".
Profile: ${JSON.stringify(profile)}

Return JSON array of 4 quarters, each with "quarter", "focus", "milestones" (array of strings).
`;
      return await AIService.generateContent(prompt);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      return [];
    }
  }
}

const careerAdvisorAIService = new CareerAdvisorAIService();
export default careerAdvisorAIService;

export const analyzeCareerPaths = (data) => careerAdvisorAIService.analyzeCareerPaths(data);
export const analyzeSkillGaps = (profile, path) => careerAdvisorAIService.analyzeSkillGaps(profile, path);
export const generateResume = (profile) => careerAdvisorAIService.generateResume(profile);
export const optimizeResume = (resume, jd) => careerAdvisorAIService.optimizeResume(resume, jd);
export const parseResume = (content, type) => careerAdvisorAIService.parseResume(content, type);
export const calculateReadinessScore = (profile, path) => careerAdvisorAIService.calculateReadinessScore(profile, path);
export const generateCareerRoadmap = (profile, path) => careerAdvisorAIService.generateCareerRoadmap(profile, path);
export const analyzeQuizResults = (data) => careerAdvisorAIService.analyzeCareerPaths(data); // Rebranded alias
