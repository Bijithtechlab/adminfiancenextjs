require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addPurchaseDateColumn() {
  try {
    const query = `
      ALTER TABLE inventory 
      ADD COLUMN IF NOT EXISTS purchase_date DATE;
    `;
    
    await pool.query(query);
    console.log('Purchase date column added successfully to inventory table');
    
  } catch (error) {
    console.error('Error adding purchase date column:', error);
  } finally {
    await pool.end();
  }
}

addPurchaseDateColumn();