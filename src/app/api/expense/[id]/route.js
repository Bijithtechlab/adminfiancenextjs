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
    
    const { category, amount, date, paidTo, paymentMethod, remarks, eventId } = body;
    const timestamp = new Date().toISOString();

    const query = `
      UPDATE expense 
      SET category = $1, amount = $2, date = $3, vendor_name = $4,
          payment_method = $5, description = $6, event_id = $7, updated_at = $8
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [
      category,
      parseFloat(amount),
      date,
      paidTo || '',
      paymentMethod || 'Cash',
      remarks || '',
      eventId || null,
      timestamp,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Expense record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Expense record updated successfully'
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { message: 'Could not update expense record', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;

    const query = 'DELETE FROM expense WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Expense record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Expense record deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { message: 'Could not delete expense record', error: error.message },
      { status: 500 }
    );
  }
}