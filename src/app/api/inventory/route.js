import { NextResponse } from 'next/server';
const { v4: uuidv4 } = require('uuid');
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

// GET /api/inventory - Get all inventory items
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    
    const query = 'SELECT * FROM inventory ORDER BY created_at DESC';
    const result = await db.query(query);

    const transformedItems = result.rows.map(item => ({
      id: item.id,
      name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      value: item.value,
      description: item.description,
      purchaseDate: item.purchase_date,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    return NextResponse.json({ inventory: transformedItems });
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve inventory items', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    
    const { name, quantity, unit, description, purchasePrice, purchaseDate } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Item name is required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO inventory (id, user_id, item_name, quantity, unit, value, description, purchase_date, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      id,
      user.id,
      name,
      parseInt(quantity) || 1,
      unit || 'pieces',
      purchasePrice ? parseFloat(purchasePrice) : 0,
      description || '',
      purchaseDate || null,
      timestamp,
      timestamp
    ];

    const result = await db.query(query, values);
    const newItem = result.rows[0];

    return NextResponse.json({
      message: 'Inventory item created successfully',
      item: {
        id: newItem.id,
        name: newItem.item_name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        value: newItem.value,
        description: newItem.description,
        purchaseDate: newItem.purchase_date
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { message: 'Could not create inventory item', error: error.message },
      { status: 500 }
    );
  }
}