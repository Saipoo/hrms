import AIService from './AIService.js';

/**
 * Generate AI-curated real-time updates for different categories
 */
class UpdateGeneratorService {
  
  /**
   * Generate corporate workforce updates
   */
  static async generateEducationUpdates() {
    try {
      const prompt = `Generate 3-5 recent and trending workforce management and HR updates. Include:

Categories to cover:
- Global HR policies and labor laws
- Remote work trends and hybrid models
- Corporate wellness initiatives
- Talent management strategies
- Employee engagement best practices

For each update, provide in JSON format:
{
  "title": "Professional headline (50-80 characters)",
  "summary": "Brief 2-3 sentence summary",
  "detailedContent": "Detailed 4-5 sentence description",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "whyItMatters": "Why this matters for modern employees/HR",
  "tags": ["relevant", "tags"],
  "priority": number (1-10),
  "targetCourses": ["Management", "Human Resources"],
  "sourceLink": ""
}

Return only valid JSON array. Focus on REAL, RECENT updates from the last 7 days.`;

      const updates = await AIService.generateContent(prompt);
      return (updates || []).map(u => ({ ...u, category: 'education' }));
    } catch (error) {
      console.error('Error generating corporate updates:', error);
      return [];
    }
  }

  /**
   * Generate Enterprise Tech & AI updates
   */
  static async generateAITechUpdates() {
    try {
      const prompt = `Generate 3-5 recent enterprise technology and AI updates relevant for professionals. Include:

Categories to cover:
- Generative AI for business productivity (Microsoft 365 Copilot, Gemini for Workspace)
- Enterprise software launches (Salesforce, SAP, Oracle)
- Cybersecurity trends for organizations
- Automation and robotics in the workplace
- Cloud infrastructure developments (AWS, Azure, GCP)

For each update, provide in JSON format:
{
  "title": "Tech-focused headline",
  "summary": "Brief 2-3 sentence summary",
  "detailedContent": "Detailed technical description for professionals",
  "keyPoints": ["Key detail 1", "Key detail 2", "Key detail 3"],
  "whyItMatters": "Business impact of this technology",
  "tags": ["AI", "Enterprise", "Tech"],
  "priority": number (1-10),
  "targetCourses": ["IT", "Data Science", "Digital Transformation"],
  "sourceLink": ""
}

Return only valid JSON array.`;

      const updates = await AIService.generateContent(prompt);
      return (updates || []).map(u => ({ ...u, category: 'ai-tech' }));
    } catch (error) {
      console.error('Error generating enterprise tech updates:', error);
      return [];
    }
  }

  /**
   * Generate Career Growth & Leadership updates
   */
  static async generateJobsInternshipsUpdates() {
    try {
      const prompt = `Generate 3-5 recent career growth and leadership insights for corporate employees. Include:

Categories to cover:
- Leadership transitions at major corporations
- Emerging professional skills (Soft skills, leadership, EQ)
- Executive coaching and mentorship trends
- Career pivoting strategies in the modern economy
- Industry-specific growth opportunities (FinTech, HealthTech, etc.)

For each update, provide in JSON format:
{
  "title": "Leadership/Career headline",
  "summary": "Brief insights or news",
  "detailedContent": "Detailed analysis for professional growth",
  "keyPoints": ["Actionable step 1", "Insight 2", "Trend 3"],
  "whyItMatters": "Impact on career progression",
  "tags": ["Leadership", "Career Growth", "Strategy"],
  "priority": number (1-10),
  "sourceLink": ""
}

Return only valid JSON array.`;

      const updates = await AIService.generateContent(prompt);
      return (updates || []).map(u => ({ ...u, category: 'jobs-internships' }));
    } catch (error) {
      console.error('Error generating career growth updates:', error);
      return [];
    }
  }

  /**
   * Generate Professional Motivation & Success Stories
   */
  static async generateMotivationalUpdates() {
    try {
      const prompt = `Generate 2-3 recent motivational updates for professionals. Include:

Categories to cover:
- Success stories of corporate leaders or startups
- Workplace culture improvements
- Resilience in high-pressure environments
- Innovative problem-solving examples in business

For each update, provide in JSON format:
{
  "title": "Inspiring professional headline",
  "summary": "Brief motivational summary",
  "detailedContent": "Detailed story with leadership lessons",
  "keyPoints": ["Lesson 1", "Lesson 2", "Lesson 3"],
  "whyItMatters": "Professional inspiration",
  "tags": ["Motivation", "Leadership", "Success"],
  "priority": number (5-8),
  "sourceLink": ""
}

Return only valid JSON array.`;

      const updates = await AIService.generateContent(prompt);
      return (updates || []).map(u => ({ ...u, category: 'motivation' }));
    } catch (error) {
      console.error('Error generating motivational updates:', error);
      return [];
    }
  }

  /**
   * Generate all updates with daily rotation to stay within quotas
   */
  static async generateAllUpdates() {
    console.log('🤖 Starting AI update generation with centralized AIService...');
    
    try {
      const allUpdates = [];
      const dayOfWeek = new Date().getDay();
      
      // Category rotation schedule
      const rotationSchedule = [
        ['education', 'jobs-internships'], // Sun
        ['education', 'ai-tech'],          // Mon
        ['jobs-internships', 'motivation'], // Tue
        ['ai-tech', 'education'],          // Wed
        ['education', 'jobs-internships'], // Thu
        ['ai-tech', 'motivation'],          // Fri
        ['education', 'ai-tech']           // Sat
      ];

      const categoriesToGenerate = rotationSchedule[dayOfWeek];
      
      const generatorMap = {
        'education': { name: 'Workforce', fn: () => this.generateEducationUpdates() },
        'ai-tech': { name: 'Enterprise Tech', fn: () => this.generateAITechUpdates() },
        'jobs-internships': { name: 'Career Growth', fn: () => this.generateJobsInternshipsUpdates() },
        'motivation': { name: 'Professional Motivation', fn: () => this.generateMotivationalUpdates() }
      };

      for (const catKey of categoriesToGenerate) {
        const generator = generatorMap[catKey];
        try {
          console.log(`  📝 Generating ${generator.name} updates...`);
          const updates = await generator.fn();
          
          if (updates && updates.length > 0) {
            allUpdates.push(...updates.map(u => this.normalizeUpdateData(u)));
          } else {
            allUpdates.push(...this.getDummyUpdates().filter(u => u.category === catKey));
          }
        } catch (error) {
          console.error(`  ❌ ${generator.name} failed:`, error.message);
          allUpdates.push(...this.getDummyUpdates().filter(u => u.category === catKey));
        }
      }

      if (allUpdates.length === 0) return this.getDummyUpdates();
      return allUpdates;
    } catch (error) {
      console.error('❌ Critical error in update generation:', error);
      return this.getDummyUpdates();
    }
  }

  static normalizeUpdateData(update) {
    return {
      title: update.title || 'Update',
      summary: update.summary || '',
      detailedContent: update.detailedContent || update.summary || '',
      keyPoints: Array.isArray(update.keyPoints) ? update.keyPoints : [],
      whyItMatters: update.whyItMatters || '',
      tags: Array.isArray(update.tags) ? update.tags : [],
      priority: update.priority || 5,
      targetCourses: Array.isArray(update.targetCourses) ? update.targetCourses : [],
      sourceLink: update.sourceLink || '',
      category: update.category || 'education',
      aiGenerated: true,
      postedAt: new Date(),
      sourceName: 'WorkSphere AI',
      imageUrl: this.getDefaultImage(update.category || 'education'),
      isActive: true,
      viewCount: 0
    };
  }

  static getDummyUpdates() {
    return [
      {
        title: 'WorkSphere HRMS: Enhancing Professional Excellence',
        summary: 'Our platform is now fully focused on empowering your professional journey with AI-driven insights.',
        detailedContent: 'Welcome to the rebranded WorkSphere HRMS. We have shifted from academic tracking to professional development, workforce management, and enterprise-grade AI support.',
        keyPoints: ['Professional dashboard', 'AI Career pathing', 'Skill gap analysis'],
        category: 'education',
        priority: 10,
        tags: ['WorkSphere', 'Update', 'HRMS']
      }
    ].map(u => this.normalizeUpdateData(u));
  }

  static getDefaultImage(category) {
    const images = {
      'education': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      'ai-tech': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
      'jobs-internships': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400',
      'motivation': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400'
    };
    return images[category] || images['education'];
  }

  /**
   * Generate professional quote of the day
   */
  static async generateQuoteOfTheDay() {
    return {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      title: "Success Mindset"
    };
  }
}

export default UpdateGeneratorService;
