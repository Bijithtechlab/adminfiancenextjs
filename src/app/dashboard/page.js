'use client';
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-green-50 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Total Income</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            ₹{dashboardData?.summary?.totalIncome?.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-red-50 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Total Expense</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">
            ₹{dashboardData?.summary?.totalExpense?.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className={`p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1 ${
          (dashboardData?.summary?.balance || 0) >= 0 ? 'bg-blue-50' : 'bg-yellow-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            (dashboardData?.summary?.balance || 0) >= 0 ? 'text-blue-900' : 'text-yellow-900'
          }`}>
            Balance
          </h3>
          <p className={`text-2xl sm:text-3xl font-bold ${
            (dashboardData?.summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            ₹{dashboardData?.summary?.balance?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        {/* Income vs Expense by Event Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Income vs Expense by Event</h3>
          <div className="h-64 w-full">
            <Bar
              data={{
                labels: dashboardData?.eventFinancials?.map(event => event.name) || ['No Events'],
                datasets: [
                  {
                    label: 'Income',
                    data: dashboardData?.eventFinancials?.map(event => event.income) || [0],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: 'Expense',
                    data: dashboardData?.eventFinancials?.map(event => event.expense) || [0],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: {
                    top: 10,
                    bottom: 10
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      boxWidth: 12,
                      padding: 15
                    }
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: true
                    },
                    ticks: {
                      callback: function(value) {
                        return '₹' + value.toLocaleString();
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      maxRotation: 0,
                      minRotation: 0,
                      maxTicksLimit: 10,
                      font: {
                        size: 11
                      }
                    }
                  }
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Income */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Recent Income</h3>
          <div className="space-y-3">
            {dashboardData?.recentIncome?.length > 0 ? (
              dashboardData.recentIncome.map((income) => (
                <div key={income.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{income.donorName}</p>
                    <p className="text-sm text-gray-600">{income.houseName || ''}</p>
                    <p className="text-xs text-gray-500">
                      {income.eventId && dashboardData.allEvents ? 
                        dashboardData.allEvents.find(event => event.id === income.eventId)?.name || income.donationType
                        : income.donationType
                      }
                    </p>
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
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Recent Expenses</h3>
          <div className="space-y-3">
            {dashboardData?.recentExpense?.length > 0 ? (
              dashboardData.recentExpense.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{expense.vendorName}</p>
                    <p className="text-sm text-gray-600">
                      {expense.eventId && dashboardData.allEvents ? 
                        dashboardData.allEvents.find(event => event.id === expense.eventId)?.name || expense.category
                        : expense.category
                      }
                    </p>
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
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Events Summary</h3>
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