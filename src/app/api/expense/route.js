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

// GET /api/expense - Get all expense records
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vendorName = searchParams.get('vendorName');
    const category = searchParams.get('category');
    const eventId = searchParams.get('eventId');

    let query = 'SELECT * FROM expense';
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    if (startDate && endDate) {
      conditions.push(`date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    if (vendorName) {
      conditions.push(`vendor_name ILIKE $${paramIndex}`);
      values.push(`%${vendorName}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (eventId) {
      conditions.push(`event_id = $${paramIndex}`);
      values.push(eventId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY date DESC';

    const result = await db.query(query, values);

    const transformedExpenses = result.rows.map(expense => ({
      id: expense.id,
      userId: expense.user_id,
      vendorName: expense.vendor_name,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      eventId: expense.event_id,
      receiptNumber: expense.receipt_number,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    }));

    return NextResponse.json({ expenses: transformedExpenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve expense records', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/expense - Create new expense record
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    
    const {
      category,
      amount,
      date,
      paidTo,
      paymentMethod,
      remarks,
      eventId
    } = body;

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const query = `
      INSERT INTO expense (
        id, user_id, vendor_name, category, amount, date, description, 
        event_id, payment_method, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      id,
      user.id,
      paidTo || '',
      category,
      parseFloat(amount),
      date,
      remarks || '',
      eventId || null,
      paymentMethod,
      timestamp,
      timestamp
    ];

    const result = await db.query(query, values);
    const newExpense = result.rows[0];
    
    const transformedExpense = {
      id: newExpense.id,
      userId: newExpense.user_id,
      vendorName: newExpense.vendor_name,
      category: newExpense.category,
      amount: newExpense.amount,
      date: newExpense.date,
      description: newExpense.description,
      eventId: newExpense.event_id,
      receiptNumber: newExpense.receipt_number,
      createdAt: newExpense.created_at,
      updatedAt: newExpense.updated_at
    };

    return NextResponse.json({
      message: 'Expense record created successfully',
      expense: transformedExpense
    }, { status: 201 });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { message: 'Could not create expense record', error: error.message },
      { status: 500 }
    );
  }
}