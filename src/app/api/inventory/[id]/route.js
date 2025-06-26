import { NextResponse } from 'next/server';
const db = require('../../../../lib/db');
const { verifyToken } = require('../../../../utils/auth');

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;
    const body = await request.json();
    
    const { name, quantity, unit, description, purchasePrice, purchaseDate } = body;
    const timestamp = new Date().toISOString();

    const query = `
      UPDATE inventory 
      SET item_name = $1, quantity = $2, unit = $3, description = $4, 
          value = $5, purchase_date = $6, updated_at = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      name,
      parseInt(quantity) || 1,
      unit || 'pieces',
      description || '',
      purchasePrice ? parseFloat(purchasePrice) : 0,
      purchaseDate || null,
      timestamp,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json(
      { message: 'Could not update inventory item', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;

    const query = 'DELETE FROM inventory WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    return NextResponse.json(
      { message: 'Could not delete inventory item', error: error.message },
      { status: 500 }
    );
  }
}