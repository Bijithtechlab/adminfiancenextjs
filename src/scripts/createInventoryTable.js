const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createInventoryTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50),
        description TEXT,
        purchase_date DATE,
        purchase_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(query);
    console.log('Inventory table created successfully');
    
    // Insert sample data
    const sampleData = `
      INSERT INTO inventory (id, name, category, quantity, unit, description, purchase_date, purchase_price, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'Incense Sticks', 'Pooja Items', 50, 'packets', 'Sandalwood incense sticks', '2024-01-15', 500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Oil Lamps', 'Pooja Items', 20, 'pieces', 'Brass oil lamps for daily pooja', '2024-01-10', 2000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Flowers', 'Decoration', 100, 'kg', 'Fresh flowers for decoration', '2024-01-20', 1500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await pool.query(sampleData);
    console.log('Sample inventory data inserted');
    
  } catch (error) {
    console.error('Error creating inventory table:', error);
  } finally {
    await pool.end();
  }
}

createInventoryTable();