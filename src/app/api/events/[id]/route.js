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
    
    const { name, description, startDate, endDate, budget, type, status } = body;
    const timestamp = new Date().toISOString();

    const query = `
      UPDATE events 
      SET name = $1, description = $2, date = $3, end_date = $4, budget = $5, 
          status = $6, updated_at = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      name,
      description || '',
      startDate,
      endDate || startDate,
      budget ? parseFloat(budget) : null,
      status || 'planned',
      timestamp,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { message: 'Could not update event', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = params;

    const query = 'DELETE FROM events WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { message: 'Could not delete event', error: error.message },
      { status: 500 }
    );
  }
}