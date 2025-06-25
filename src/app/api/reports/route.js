import { NextResponse } from 'next/server';
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

// GET /api/reports - Get P&L report
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Get total income and breakdown
    const incomeQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(*) as income_count,
        donation_type,
        SUM(amount) as type_amount
      FROM income 
      WHERE date BETWEEN $1 AND $2
      GROUP BY donation_type
    `;
    const incomeResult = await db.query(incomeQuery, [startDate, endDate]);

    // Get total expense and breakdown  
    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_expense,
        COUNT(*) as expense_count,
        vendor_name,
        SUM(amount) as vendor_amount
      FROM expense 
      WHERE date BETWEEN $1 AND $2
      GROUP BY vendor_name
    `;
    const expenseResult = await db.query(expenseQuery, [startDate, endDate]);

    // Calculate totals
    const totalIncome = incomeResult.rows.reduce((sum, row) => sum + parseFloat(row.type_amount || 0), 0);
    const totalExpense = expenseResult.rows.reduce((sum, row) => sum + parseFloat(row.vendor_amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Get counts
    const incomeCountQuery = 'SELECT COUNT(*) as count FROM income WHERE date BETWEEN $1 AND $2';
    const expenseCountQuery = 'SELECT COUNT(*) as count FROM expense WHERE date BETWEEN $1 AND $2';
    
    const incomeCountResult = await db.query(incomeCountQuery, [startDate, endDate]);
    const expenseCountResult = await db.query(expenseCountQuery, [startDate, endDate]);

    const pnlData = {
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        incomeCount: parseInt(incomeCountResult.rows[0].count),
        expenseCount: parseInt(expenseCountResult.rows[0].count)
      },
      incomeBreakdown: incomeResult.rows.map(row => ({
        type: row.donation_type || 'General',
        amount: parseFloat(row.type_amount || 0)
      })),
      expenseBreakdown: expenseResult.rows.map(row => ({
        paidTo: row.vendor_name || 'Unknown',
        amount: parseFloat(row.vendor_amount || 0)
      }))
    };

    return NextResponse.json(pnlData);
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { message: 'Could not generate report', error: error.message },
      { status: 500 }
    );
  }
}