const db = require('../lib/db');

async function addEndDateColumn() {
  try {
    console.log('Adding end_date column to events table...');
    
    // Add end_date column
    await db.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS end_date DATE
    `);
    
    // Update existing records to set end_date same as date (start_date)
    await db.query(`
      UPDATE events 
      SET end_date = date 
      WHERE end_date IS NULL
    `);
    
    console.log('Successfully added end_date column to events table');
    console.log('Updated existing records with end_date = date');
    
  } catch (error) {
    console.error('Error adding end_date column:', error);
  } finally {
    process.exit();
  }
}

addEndDateColumn();