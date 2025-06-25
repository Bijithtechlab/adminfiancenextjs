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
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const name = searchParams.get('name');

    let query = 'SELECT * FROM inventory';
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    if (category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      values.push(`%${name}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC';

    const result = await db.query(query, values);

    const transformedItems = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description,
      purchaseDate: item.purchase_date,
      purchasePrice: item.purchase_price,
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
    
    const {
      name,
      category,
      quantity,
      unit,
      description,
      purchaseDate,
      purchasePrice
    } = body;

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const query = `
      INSERT INTO inventory (
        id, name, category, quantity, unit, description, 
        purchase_date, purchase_price, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      id,
      name,
      category,
      parseInt(quantity) || 1,
      unit,
      description || '',
      purchaseDate || null,
      purchasePrice ? parseFloat(purchasePrice) : null,
      timestamp,
      timestamp
    ];

    const result = await db.query(query, values);
    const newItem = result.rows[0];
    
    const transformedItem = {
      id: newItem.id,
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      unit: newItem.unit,
      description: newItem.description,
      purchaseDate: newItem.purchase_date,
      purchasePrice: newItem.purchase_price,
      createdAt: newItem.created_at,
      updatedAt: newItem.updated_at
    };

    return NextResponse.json({
      message: 'Inventory item created successfully',
      item: transformedItem
    }, { status: 201 });
  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { message: 'Could not create inventory item', error: error.message },
      { status: 500 }
    );
  }
}