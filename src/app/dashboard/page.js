'use client';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (dateRange === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else if (dateRange !== 'all') {
        const periodMap = {
          'today': '1day',
          'week': '7days', 
          'month': '30days',
          'quarter': '90days',
          'year': '1year'
        };
        params.append('period', periodMap[dateRange] || '1year');
      }
      
      const response = await fetch(`/api/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setError('');
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Date Range Filter */}
        <div className="flex gap-4 items-center">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{dashboardData?.summary?.totalIncome?.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Total Expense</h3>
          <p className="text-3xl font-bold text-red-600">
            ₹{dashboardData?.summary?.totalExpense?.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className={`p-6 rounded-lg shadow-md ${
          (dashboardData?.summary?.balance || 0) >= 0 ? 'bg-blue-50' : 'bg-yellow-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            (dashboardData?.summary?.balance || 0) >= 0 ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            Balance
          </h3>
          <p className={`text-3xl font-bold ${
            (dashboardData?.summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            ₹{dashboardData?.summary?.balance?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Income */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Income</h3>
          <div className="space-y-3">
            {dashboardData?.recentIncome?.length > 0 ? (
              dashboardData.recentIncome.map((income) => (
                <div key={income.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <div>
                    <p className="font-medium">{income.donorName}</p>
                    <p className="text-sm text-gray-600">{income.donationType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹{parseFloat(income.amount).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{new Date(income.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent income records</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {dashboardData?.recentExpense?.length > 0 ? (
              dashboardData.recentExpense.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium">{expense.vendorName}</p>
                    <p className="text-sm text-gray-600">{expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">₹{parseFloat(expense.amount).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent expense records</p>
            )}
          </div>
        </div>
      </div>

      {/* Events Summary */}
      {dashboardData?.events && Object.keys(dashboardData.events).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Events Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.events).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-gray-800">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}