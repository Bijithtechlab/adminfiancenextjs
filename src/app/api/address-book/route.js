import { NextResponse } from 'next/server';
const { v4: uuidv4 } = require('uuid');
const db = require('../../../lib/db');
const { verifyToken } = require('../../../utils/auth');

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

// GET /api/address-book - Get all contacts
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = 'SELECT * FROM address_book ORDER BY person_name ASC';
    let params = [];

    if (search) {
      query = `
        SELECT * FROM address_book 
        WHERE person_name ILIKE $1 OR phone_number ILIKE $1 OR address ILIKE $1
        ORDER BY person_name ASC
      `;
      params = [`%${search}%`];
    }

    const result = await db.query(query, params);
    return NextResponse.json({ contacts: result.rows });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve contacts', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/address-book - Create new contact
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { person_name, house_name, address, phone_number, email, category, notes } = body;

    if (!person_name || !address || !phone_number) {
      return NextResponse.json(
        { message: 'Person name, address, and phone number are required' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const query = `
      INSERT INTO address_book (id, person_name, house_name, address, phone_number, email, category, notes, created_at, updated_at, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      id, person_name, house_name, address, phone_number, 
      email, category || 'general', notes, timestamp, timestamp, user.id
    ];

    const result = await db.query(query, values);
    return NextResponse.json({
      message: 'Contact created successfully',
      contact: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { message: 'Could not create contact', error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/address-book - Update contact
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { id, person_name, house_name, address, phone_number, email, category, notes } = body;

    if (!id || !person_name || !address || !phone_number) {
      return NextResponse.json(
        { message: 'ID, person name, address, and phone number are required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE address_book 
      SET person_name = $1, house_name = $2, address = $3, phone_number = $4, 
          email = $5, category = $6, notes = $7, updated_at = $8
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [
      person_name, house_name || '', address, phone_number, 
      email, category || 'general', notes, new Date().toISOString(), id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Contact updated successfully',
      contact: result.rows[0]
    });
  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json(
      { message: 'Could not update contact', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/address-book - Delete contact
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const result = await db.query('DELETE FROM address_book WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { message: 'Could not delete contact', error: error.message },
      { status: 500 }
    );
  }
}