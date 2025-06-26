import { NextResponse } from 'next/server';
const db = require('../../../../lib/db');
const { verifyToken } = require('../../../../utils/auth');

// Helper function to get user from token
async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

// PUT /api/income/[id] - Update income record
export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;
    const body = await request.json();
    
    const {
      donorName,
      houseName,
      address,
      phoneNumber,
      amount,
      date,
      description,
      donationType,
      eventId,
      receiptNumber
    } = body;

    const timestamp = new Date().toISOString();

    const query = `
      UPDATE income 
      SET donor_name = $1, house_name = $2, address = $3, phone_number = $4,
          amount = $5, date = $6, description = $7, donation_type = $8, 
          event_id = $9, receipt_number = $10, updated_at = $11
      WHERE id = $12
      RETURNING *
    `;
    
    const values = [
      donorName,
      houseName || '',
      address || '',
      phoneNumber || '',
      parseFloat(amount),
      date,
      description || '',
      donationType || 'general',
      eventId || null,
      receiptNumber || '',
      timestamp,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Income record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Income record updated successfully'
    });
  } catch (error) {
    console.error('Update income error:', error);
    return NextResponse.json(
      { message: 'Could not update income record', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/income/[id] - Delete income record
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;

    const query = 'DELETE FROM income WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Income record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Income record deleted successfully'
    });
  } catch (error) {
    console.error('Delete income error:', error);
    return NextResponse.json(
      { message: 'Could not delete income record', error: error.message },
      { status: 500 }
    );
  }
}