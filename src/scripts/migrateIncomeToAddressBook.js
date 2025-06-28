const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

async function migrateIncomeToAddressBook() {
  try {
    console.log('Starting migration of income records to address book...');
    
    // Get all income records with contact details
    const incomeQuery = `
      SELECT DISTINCT donor_name, house_name, address, phone_number 
      FROM income 
      WHERE donor_name IS NOT NULL AND donor_name != ''
      AND (address IS NOT NULL AND address != '' OR phone_number IS NOT NULL AND phone_number != '')
    `;
    
    const incomeResult = await db.query(incomeQuery);
    console.log(`Found ${incomeResult.rows.length} unique contacts in income records`);
    
    const timestamp = new Date().toISOString();
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const record of incomeResult.rows) {
      const { donor_name, house_name, address, phone_number } = record;
      
      // Check if contact already exists
      const existingQuery = `
        SELECT id FROM address_book 
        WHERE person_name = $1 OR (phone_number = $2 AND phone_number != '')
      `;
      const existing = await db.query(existingQuery, [donor_name, phone_number || '']);
      
      if (existing.rows.length === 0) {
        // Add new contact
        const contactId = uuidv4();
        await db.query(`
          INSERT INTO address_book (
            id, person_name, house_name, address, phone_number, 
            category, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          contactId,
          donor_name,
          house_name || '',
          address || '',
          phone_number || '',
          'donor',
          'Migrated from income records',
          timestamp,
          timestamp
        ]);
        
        addedCount++;
        console.log(`Added: ${donor_name}`);
      } else {
        skippedCount++;
        console.log(`Skipped (exists): ${donor_name}`);
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Added: ${addedCount} contacts`);
    console.log(`- Skipped: ${skippedCount} existing contacts`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateIncomeToAddressBook();