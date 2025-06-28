const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

async function populateAddressBook() {
  try {
    // Sample address book data
    const contacts = [
      {
        id: uuidv4(),
        person_name: 'John Smith',
        house_name: 'Rose Villa',
        address: '123 Main Street, Downtown, City - 12345',
        phone_number: '+1-555-0123',
        email: 'john.smith@email.com',
        category: 'business',
        notes: 'Local business owner, hardware store'
      },
      {
        id: uuidv4(),
        person_name: 'Mary Johnson',
        house_name: 'Green House',
        address: '456 Oak Avenue, Suburb Area, City - 12346',
        phone_number: '+1-555-0456',
        email: 'mary.johnson@email.com',
        category: 'family',
        notes: 'Family friend, doctor'
      },
      {
        id: uuidv4(),
        person_name: 'David Wilson',
        house_name: 'Blue Cottage',
        address: '789 Pine Road, Hill View, City - 12347',
        phone_number: '+1-555-0789',
        email: 'david.wilson@email.com',
        category: 'emergency',
        notes: 'Emergency contact, electrician'
      },
      {
        id: uuidv4(),
        person_name: 'Sarah Brown',
        house_name: 'White Manor',
        address: '321 Elm Street, Garden District, City - 12348',
        phone_number: '+1-555-0321',
        email: 'sarah.brown@email.com',
        category: 'general',
        notes: 'Neighbor, teacher at local school'
      },
      {
        id: uuidv4(),
        person_name: 'Michael Davis',
        house_name: 'Red Brick House',
        address: '654 Maple Lane, Riverside, City - 12349',
        phone_number: '+1-555-0654',
        email: 'michael.davis@email.com',
        category: 'business',
        notes: 'Accountant, tax consultant'
      }
    ];

    const timestamp = new Date().toISOString();

    for (const contact of contacts) {
      // Check if contact already exists
      const existingContact = await db.query(
        'SELECT id FROM address_book WHERE phone_number = $1', 
        [contact.phone_number]
      );
      
      if (existingContact.rows.length === 0) {
        await db.query(`
          INSERT INTO address_book (
            id, person_name, house_name, address, phone_number, 
            email, category, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          contact.id, contact.person_name, contact.house_name, 
          contact.address, contact.phone_number, contact.email, 
          contact.category, contact.notes, timestamp, timestamp
        ]);
        console.log(`Added contact: ${contact.person_name}`);
      } else {
        console.log(`Contact already exists: ${contact.person_name}`);
      }
    }

    console.log('Address book population completed');
    process.exit(0);
  } catch (error) {
    console.error('Error populating address book:', error);
    process.exit(1);
  }
}

populateAddressBook();