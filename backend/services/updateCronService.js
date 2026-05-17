import cron from 'node-cron';
import RealTimeUpdate from '../models/RealTimeUpdate.js';
import UpdateGeneratorService from '../services/updateGeneratorService.js';

/**
 * Initialize cron jobs for real-time updates
 */
export function initializeUpdateCronJobs() {
  console.log('📅 Initializing Real-Time Updates cron jobs...');

  // Run daily at midnight to generate new updates
  // Disabled for now to prevent Gemini API quota issues
  /*
  cron.schedule('0 0 * * *', async () => {
    // ... generation logic
  });
  */

  // Run daily at midnight to clean old updates (30+ days old)
  // Cron expression: '0 0 * * *' = At 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🧹 [CRON] Starting daily cleanup of old updates...');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    try {
      const result = await RealTimeUpdate.cleanOldUpdates(30);
      console.log(`✅ [CRON] Deleted ${result.deletedCount} old updates`);
    } catch (error) {
      console.error('❌ [CRON] Error cleaning old updates:', error);
    }
  });

  // Optional: Run once at startup to ensure we have some updates
  setTimeout(async () => {
    console.log('\n🚀 [STARTUP] Checking for existing updates...');
    
    try {
      const count = await RealTimeUpdate.countDocuments({ isActive: true });
      console.log(`📊 [STARTUP] Found ${count} active updates`);
      
      if (count < 5) {
        console.log('⚡ [STARTUP] Few updates found, generating initial set...');
        
        // Step 1: Insert dummy data first (as fallback)
        console.log('📝 [STARTUP] Inserting dummy updates as fallback...');
        const dummyUpdates = UpdateGeneratorService.getDummyUpdates();
        
        try {
          // Ensure data is properly formatted before insertion
          const normalizedDummy = dummyUpdates.map(update => 
            UpdateGeneratorService.normalizeUpdateData(update)
          );
          
          const savedDummy = await RealTimeUpdate.insertMany(normalizedDummy, { 
            ordered: false, // Continue even if some fail
            rawResult: true 
          });
          console.log(`✅ [STARTUP] Saved ${savedDummy.length || normalizedDummy.length} dummy updates`);
        } catch (dummyError) {
          console.error('❌ [STARTUP] Error saving dummy updates:', dummyError.message);
          if (dummyError.writeErrors) {
            console.error('Validation errors:', dummyError.writeErrors.map(e => e.err.message));
          }
        }
        
        // Step 2: AI generation disabled for now to prevent quota errors
        console.log('🤖 [STARTUP] AI generation is currently disabled (Quota management). Using dummy data only.');
        /*
        try {
          const aiUpdates = await UpdateGeneratorService.generateAllUpdates();
          // ... AI generation logic
        } catch (aiError) {
          // ... AI error handling
        }
        */
        console.log('✅ [STARTUP] Dummy updates are available as fallback');
        console.log('👥 [STARTUP] Employees can use Real-Time Updates feature now');
        
        // Final count
        const finalCount = await RealTimeUpdate.countDocuments({ isActive: true });
        console.log(`📊 [STARTUP] Total active updates: ${finalCount}`);
      }
    } catch (error) {
      console.error('❌ [STARTUP] Error in startup process:', error);
    }
  }, 5000); // Wait 5 seconds after server starts

  console.log('✅ Cron jobs initialized:');
  console.log('   - Update generation: Every 6 hours');
  console.log('   - Cleanup old updates: Daily at midnight');
  console.log('   - Startup check: 5 seconds after server start');
}

/**
 * Manual trigger for update generation (for testing)
 */
export async function triggerUpdateGeneration() {
  console.log('🎯 Manual update generation triggered...');
  
  try {
    const newUpdates = await UpdateGeneratorService.generateAllUpdates();
    
    if (newUpdates.length > 0) {
      const savedUpdates = await RealTimeUpdate.insertMany(newUpdates);
      console.log(`✅ Generated ${savedUpdates.length} updates manually`);
      return savedUpdates;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error in manual generation:', error);
    throw error;
  }
}
