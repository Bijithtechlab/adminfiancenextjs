const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

async function createSuperAdmin() {
  try {
    const email = 'superadmin@periyakkamannil.com';
    const password = 'periya123';
    const name = 'Super Administrator';
    const role = 'Super Admin';
    
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('Super Admin user already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated password hash:', hashedPassword);
    
    // Create the user
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const query = `
      INSERT INTO users (id, name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [id, name, email, hashedPassword, role, timestamp, timestamp];
    const result = await db.query(query, values);
    
    console.log('Super Admin user created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('User ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('Error creating Super Admin:', error);
  } finally {
    process.exit();
  }
}

createSuperAdmin();