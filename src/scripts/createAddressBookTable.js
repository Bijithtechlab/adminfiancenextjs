const db = require('../lib/db');

async function createAddressBookTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS address_book (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_name VARCHAR(255) NOT NULL,
        house_name VARCHAR(255),
        address TEXT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        category VARCHAR(50) DEFAULT 'general',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id)
      );
    `;

    await db.query(createTableQuery);
    console.log('Address book table created successfully');

    // Create index for better search performance
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_address_book_name ON address_book(person_name);
      CREATE INDEX IF NOT EXISTS idx_address_book_phone ON address_book(phone_number);
    `;
    
    await db.query(createIndexQuery);
    console.log('Address book indexes created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error creating address book table:', error);
    process.exit(1);
  }
}

createAddressBookTable();