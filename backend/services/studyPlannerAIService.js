import AIService from './AIService.js';

class StudyPlannerAIService {
  /**
   * Generate optimized weekly duty roster based on employee data
   */
  async generateWeeklySchedule(employeeData) {
    try {
      const { 
        projects = [], 
        deadlines = [], 
        performanceKpis = {},
        preferences = {}
      } = employeeData || {};

      const prompt = `
You are an AI Professional Planner. Generate an optimized weekly duty roster for an employee.

Employee Profile:
- Projects: ${(projects || []).join(', ')}
- Deadlines: ${(deadlines || []).map(d => `${d.title} (Due: ${d.date})`).join(', ')}
- Working Hours: ${preferences?.workHoursPerDay || 8} hours
- Preferred Focus Time: ${preferences?.preferredFocusTime || 'morning'}

Requirements:
1. Allocate more time to critical project deadlines.
2. Include short breaks (15 min) after every 2 hours of deep work.
3. Balance between collaboration meetings and individual focus work.
4. Schedule difficult tasks during preferred focus time.

Return a JSON array of objects for all 7 days with "day" and "slots" (startTime, endTime, task, description, type).
Types: "work", "break", "meeting", "planning".
`;

      const schedule = await AIService.generateContent(prompt);
      
      return {
        success: true,
        schedule: (schedule || []).map(day => ({
          ...day,
          slots: day.slots.map(slot => ({ ...slot, aiGenerated: true }))
        })),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating duty roster:', error);
      return { success: false, message: 'Failed to generate schedule' };
    }
  }

  /**
   * Analyze performance gaps and provide recommendations
   */
  async generateRecommendations(employeeProfile) {
    try {
      const prompt = `
Analyze employee productivity and provide 5-7 actionable professional growth recommendations.
Profile: ${JSON.stringify(employeeProfile)}

Return JSON array of objects with "type", "priority", "message", "actionable".
Types: "skill-up", "time-management", "wellness", "networking".
`;

      const recommendations = await AIService.generateContent(prompt);
      
      return {
        success: true,
        recommendations: (recommendations || []).map(rec => ({
          ...rec,
          generatedAt: new Date(),
          completed: false
        })),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return { success: false, message: 'Failed to generate recommendations' };
    }
  }

  /**
   * Analyze performance gaps in professional skills
   */
  async analyzePerformanceGaps(performanceData) {
    try {
      const prompt = `
Analyze performance gaps based on recent KPI data:
${JSON.stringify(performanceData)}

Identify work areas that need improvement and suggest specific professional development steps.
Return JSON array of strings (the work areas/skills needing improvement).
`;

      const gaps = await AIService.generateContent(prompt);
      return gaps || [];
    } catch (error) {
      console.error('Error analyzing performance gaps:', error);
      return [];
    }
  }

  /**
   * Optimize a professional focus session
   */
  async optimizeFocusSession(taskData) {
    try {
      const prompt = `
Optimize a professional focus session for this task:
${JSON.stringify(taskData)}

Return JSON: { "focusDuration": number, "breakDuration": number, "cycles": number, "tips": [] }
`;

      return await AIService.generateContent(prompt);
    } catch (error) {
      console.error('Error optimizing focus session:', error);
      return { focusDuration: 50, breakDuration: 10, cycles: 4, tips: [] };
    }
  }

  /**
   * Generate skill advancement tips for a specific work area
   */
  async generateSkillAdvancementTips(area, goals) {
    try {
      const prompt = `
Provide advanced professional tips for mastering "${area}" based on these career goals:
${JSON.stringify(goals)}

Return JSON array of objects with "tip", "reason", "impact".
`;

      return await AIService.generateContent(prompt);
    } catch (error) {
      console.error('Error generating skill tips:', error);
      return [];
    }
  }
}

const studyPlannerAIService = new StudyPlannerAIService();
export default studyPlannerAIService;

export const generateWeeklySchedule = (data) => studyPlannerAIService.generateWeeklySchedule(data);
export const generateRecommendations = (profile) => studyPlannerAIService.generateRecommendations(profile);
export const analyzePerformanceGaps = (data) => studyPlannerAIService.analyzePerformanceGaps(data);
export const optimizeFocusSession = (data) => studyPlannerAIService.optimizeFocusSession(data);
export const generateSkillAdvancementTips = (area, goals) => studyPlannerAIService.generateSkillAdvancementTips(area, goals);
