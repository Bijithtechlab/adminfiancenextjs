'use client';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodType, setPeriodType] = useState('year');

  useEffect(() => {
    fetchPnLData();
  }, []);

  const fetchPnLData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      
      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPnlData(data);
        setError('');
      } else {
        setError('Failed to load report data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setPeriodType(period);
    const now = new Date();
    
    switch (period) {
      case 'month':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        setStartDate(new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]);
        setEndDate(new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]);
        break;
      case 'year':
        setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
        setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]);
        break;
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-4">Loading report...</div>;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl md:text-3xl font-bold">Profit & Loss Statement</h1>
        <button
          onClick={handlePrint}
          className="bg-blue-500 text-white px-6 py-3 text-base rounded-lg hover:bg-blue-600 min-h-[44px] touch-manipulation"
        >
          Print Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={periodType}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={periodType !== 'custom'}
              className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={periodType !== 'custom'}
              className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={fetchPnLData}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 min-h-[44px]"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {pnlData && (
        <div className="print-content">
          {/* Report Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Periyakkamannil Temple</h1>
            <h2 className="text-2xl font-semibold text-purple-500 mb-2">Profit & Loss Statement</h2>
            <p className="text-lg text-gray-600">
              {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </p>
          </div>

          {/* Financial Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 className="text-sm text-green-800 mb-2">Total Income</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(pnlData.summary.totalIncome)}</p>
                <p className="text-sm text-green-600">{pnlData.summary.incomeCount} transactions</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h4 className="text-sm text-red-800 mb-2">Total Expenses</h4>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(pnlData.summary.totalExpense)}</p>
                <p className="text-sm text-red-600">{pnlData.summary.expenseCount} transactions</p>
              </div>
              <div className={`p-6 rounded-lg border ${
                pnlData.summary.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h4 className={`text-sm mb-2 ${
                  pnlData.summary.netProfit >= 0 ? 'text-blue-800' : 'text-yellow-800'
                }`}>Net Result</h4>
                <p className={`text-2xl font-bold ${
                  pnlData.summary.netProfit >= 0 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {formatCurrency(pnlData.summary.netProfit)}
                </p>
                <p className={`text-sm ${
                  pnlData.summary.netProfit >= 0 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {pnlData.summary.netProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
          </div>

          {/* Income Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Income Analysis</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Income Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pnlData.incomeBreakdown.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {pnlData.summary.totalIncome > 0 
                          ? ((item.amount / pnlData.summary.totalIncome) * 100).toFixed(2)
                          : '0.00'}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total Income
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(pnlData.summary.totalIncome)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Expense Analysis</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid To
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pnlData.expenseBreakdown.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.paidTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {pnlData.summary.totalExpense > 0 
                          ? ((item.amount / pnlData.summary.totalExpense) * 100).toFixed(2)
                          : '0.00'}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total Expenses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(pnlData.summary.totalExpense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Result */}
          <div className={`p-6 rounded-lg text-center border-2 ${
            pnlData.summary.netProfit >= 0 
              ? 'bg-green-100 border-green-300' 
              : 'bg-red-100 border-red-300'
          }`}>
            <h3 className={`text-3xl font-bold ${
              pnlData.summary.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              Net Result: {formatCurrency(Math.abs(pnlData.summary.netProfit))}
            </h3>
            <p className={`text-xl font-semibold mt-2 ${
              pnlData.summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              ({pnlData.summary.netProfit >= 0 ? 'Profit' : 'Loss'})
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}