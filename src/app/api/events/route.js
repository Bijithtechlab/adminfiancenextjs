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

// GET /api/events - Get all events
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM events';
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    if (startDate && endDate) {
      conditions.push(`date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status.toLowerCase());
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY date DESC';

    const result = await db.query(query, values);

    // Calculate actual income, expense, and balance for each event
    const eventsWithCalculations = await Promise.all(
      result.rows.map(async (eventRow) => {
        // Get actual income for this event
        const incomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE event_id = $1';
        const incomeResult = await db.query(incomeQuery, [eventRow.id]);
        const actualIncome = parseFloat(incomeResult.rows[0].total) || 0;
        
        // Get actual expense for this event
        const expenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expense WHERE event_id = $1';
        const expenseResult = await db.query(expenseQuery, [eventRow.id]);
        const actualExpense = parseFloat(expenseResult.rows[0].total) || 0;
        
        // Calculate balance
        const balance = actualIncome - actualExpense;
        
        return {
          ...eventRow,
          total_income: actualIncome,
          total_expense: actualExpense,
          balance: balance
        };
      })
    );

    return NextResponse.json({ events: eventsWithCalculations });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve events', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    
    const {
      name,
      description,
      startDate,
      endDate,
      budget,
      type,
      status
    } = body;

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const query = `
      INSERT INTO events (
        id, name, description, date, budget, status, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      id,
      name,
      description || '',
      startDate,
      budget ? parseFloat(budget) : null,
      status || 'planned',
      timestamp,
      timestamp
    ];

    const result = await db.query(query, values);
    const newEvent = result.rows[0];
    
    return NextResponse.json({
      message: 'Event created successfully',
      event: newEvent
    }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    console.error('Error details:', error.stack);
    return NextResponse.json(
      { message: 'Could not create event', error: error.message, details: error.stack },
      { status: 500 }
    );
  }
}