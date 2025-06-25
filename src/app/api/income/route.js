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

// GET /api/income - Get all income records
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const donorName = searchParams.get('donorName');
    const donationType = searchParams.get('donationType');
    const eventId = searchParams.get('eventId');

    let query = 'SELECT * FROM income';
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    if (startDate && endDate) {
      conditions.push(`date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      values.push(startDate, endDate);
      paramIndex += 2;
    }

    if (donorName) {
      conditions.push(`donor_name ILIKE $${paramIndex}`);
      values.push(`%${donorName}%`);
      paramIndex++;
    }

    if (donationType) {
      conditions.push(`donation_type = $${paramIndex}`);
      values.push(donationType);
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

    const transformedIncomes = result.rows.map(income => ({
      id: income.id,
      userId: income.user_id,
      donorName: income.donor_name,
      houseName: income.house_name,
      address: income.address,
      phoneNumber: income.phone_number,
      amount: income.amount,
      date: income.date,
      description: income.description,
      donationType: income.donation_type,
      eventId: income.event_id,
      receiptNumber: income.receipt_number,
      createdAt: income.created_at,
      updatedAt: income.updated_at
    }));

    return NextResponse.json({ incomes: transformedIncomes });
  } catch (error) {
    console.error('Get incomes error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve income records', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/income - Create new income record
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
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
    const id = uuidv4();

    const query = `
      INSERT INTO income (
        id, user_id, donor_name, house_name, address, phone_number,
        amount, date, description, donation_type, event_id, receipt_number,
        created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      id,
      user.id,
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
      timestamp
    ];

    const result = await db.query(query, values);
    const newIncome = result.rows[0];
    
    const transformedIncome = {
      id: newIncome.id,
      userId: newIncome.user_id,
      donorName: newIncome.donor_name,
      houseName: newIncome.house_name,
      address: newIncome.address,
      phoneNumber: newIncome.phone_number,
      amount: newIncome.amount,
      date: newIncome.date,
      description: newIncome.description,
      donationType: newIncome.donation_type,
      eventId: newIncome.event_id,
      receiptNumber: newIncome.receipt_number,
      createdAt: newIncome.created_at,
      updatedAt: newIncome.updated_at
    };

    return NextResponse.json({
      message: 'Income record created successfully',
      income: transformedIncome
    }, { status: 201 });
  } catch (error) {
    console.error('Create income error:', error);
    return NextResponse.json(
      { message: 'Could not create income record', error: error.message },
      { status: 500 }
    );
  }
}