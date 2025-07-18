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

// GET /api/dashboard - Get dashboard data
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateCondition = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateCondition = 'WHERE date BETWEEN $1 AND $2';
      dateParams = [startDate, endDate];
    } else if (period !== 'all') {
      const periodMap = {
        '1day': 1,
        '7days': 7,
        '30days': 30,
        '90days': 90,
        '1year': 365
      };
      
      const days = periodMap[period] || 365;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      dateCondition = 'WHERE date >= $1';
      dateParams = [fromDate.toISOString().split('T')[0]];
    }

    // Get total income
    const incomeQuery = `SELECT COALESCE(SUM(amount), 0) as total FROM income ${dateCondition}`;
    const incomeResult = await db.query(incomeQuery, dateParams);
    const totalIncome = parseFloat(incomeResult.rows[0].total) || 0;

    // Get total expense
    const expenseQuery = `SELECT COALESCE(SUM(amount), 0) as total FROM expense ${dateCondition}`;
    const expenseResult = await db.query(expenseQuery, dateParams);
    const totalExpense = parseFloat(expenseResult.rows[0].total) || 0;

    // Get recent income records (most recently added)
    const recentIncomeQuery = `SELECT * FROM income ${dateCondition} ORDER BY created_at DESC LIMIT 5`;
    const recentIncomeResult = await db.query(recentIncomeQuery, dateParams);

    // Get recent expense records (most recently added)
    const recentExpenseQuery = `SELECT * FROM expense ${dateCondition} ORDER BY created_at DESC LIMIT 5`;
    const recentExpenseResult = await db.query(recentExpenseQuery, dateParams);

    // Get events summary
    const eventsQuery = `SELECT COUNT(*) as total, status FROM events GROUP BY status`;
    const eventsResult = await db.query(eventsQuery);

    // Get all events for lookup
    const allEventsQuery = `SELECT id, name FROM events`;
    const allEventsResult = await db.query(allEventsQuery);

    // Get event-wise financial data
    const eventFinancialsQuery = `
      SELECT 
        e.id,
        e.name,
        COALESCE(i.total_income, 0) as income,
        COALESCE(ex.total_expense, 0) as expense
      FROM events e
      LEFT JOIN (
        SELECT event_id, SUM(amount) as total_income 
        FROM income 
        WHERE event_id IS NOT NULL ${dateCondition ? 'AND ' + dateCondition.replace('WHERE ', '') : ''}
        GROUP BY event_id
      ) i ON e.id = i.event_id
      LEFT JOIN (
        SELECT event_id, SUM(amount) as total_expense 
        FROM expense 
        WHERE event_id IS NOT NULL ${dateCondition ? 'AND ' + dateCondition.replace('WHERE ', '') : ''}
        GROUP BY event_id
      ) ex ON e.id = ex.event_id
      ORDER BY e.name
    `;
    const eventFinancialsResult = await db.query(eventFinancialsQuery, dateParams);

    // Get monthly income/expense for chart
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN 'income' = $${dateParams.length + 1} THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN 'expense' = $${dateParams.length + 1} THEN amount ELSE 0 END) as expense
      FROM (
        SELECT date, amount FROM income ${dateCondition}
        UNION ALL
        SELECT date, amount FROM expense ${dateCondition}
      ) combined
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;

    const dashboardData = {
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        period: period
      },
      recentIncome: recentIncomeResult.rows.map(income => ({
        id: income.id,
        donorName: income.donor_name,
        houseName: income.house_name,
        amount: income.amount,
        date: income.date,
        donationType: income.donation_type,
        eventId: income.event_id
      })),
      recentExpense: recentExpenseResult.rows.map(expense => ({
        id: expense.id,
        vendorName: expense.vendor_name,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        eventId: expense.event_id
      })),
      allEvents: allEventsResult.rows.map(event => ({
        id: event.id,
        name: event.name
      })),
      eventFinancials: eventFinancialsResult.rows.map(event => ({
        id: event.id,
        name: event.name,
        income: parseFloat(event.income) || 0,
        expense: parseFloat(event.expense) || 0
      })),
      events: eventsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.total);
        return acc;
      }, {})
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: 'Could not retrieve dashboard data', error: error.message },
      { status: 500 }
    );
  }
}