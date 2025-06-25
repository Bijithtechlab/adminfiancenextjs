const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

async function createTestUsers() {
  try {
    const timestamp = new Date().toISOString();
    
    // Create test users with different roles
    const users = [
      {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@temple.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        id: uuidv4(),
        name: 'Manager User',
        email: 'manager@temple.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager'
      },
      {
        id: uuidv4(),
        name: 'Accountant User',
        email: 'accountant@temple.com',
        password: await bcrypt.hash('accountant123', 10),
        role: 'accountant'
      },
      {
        id: uuidv4(),
        name: 'Data Entry User',
        email: 'dataentry@temple.com',
        password: await bcrypt.hash('dataentry123', 10),
        role: 'data-entry'
      }
    ];

    for (const user of users) {
      // Check if user already exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length === 0) {
        await db.query(
          'INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [user.id, user.name, user.email, user.password, user.role, timestamp, timestamp]
        );
        console.log(`Created user: ${user.email} with role: ${user.role}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }

    console.log('Test users creation completed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();