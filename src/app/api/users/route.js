import { NextResponse } from 'next/server';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../../../lib/db');
const { verifyToken } = require('../../../utils/auth');

// Helper function to get user from token
async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

// GET /api/users - Get all users
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    const query = 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await db.query(query);

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve users', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await db.query(existingUserQuery, [email]);
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const query = `
      INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, created_at
    `;
    
    const values = [
      id,
      name,
      email,
      hashedPassword,
      role || 'data-entry',
      timestamp,
      timestamp
    ];

    const result = await db.query(query, values);
    const newUser = result.rows[0];

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { message: 'Could not create user', error: error.message },
      { status: 500 }
    );
  }
}