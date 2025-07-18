'use client';
import { useState, useEffect } from 'react';
import PageGuard from '../../components/PageGuard';
import { Permission } from '../../components/Permission';
import { usePermissions } from '../../hooks/usePermissions';

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { userRole, checkPermission } = usePermissions();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showCompact, setShowCompact] = useState(true);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [formData, setFormData] = useState({
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    paymentMethod: 'Cash',
    remarks: '',
    eventId: ''
  });

  const categories = [
    'Maintenance',
    'Pooja',
    'Salary',
    'Events',
    'Utilities',
    'Supplies',
    'Other'
  ];

  const paymentMethods = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Cheque',
    'Other'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchEvents();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/expense', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses);
        setFilteredExpenses(data.expenses);
      } else {
        setError('Failed to fetch expense records');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/expense/${editingId}` : '/api/expense';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          category: 'Maintenance',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paidTo: '',
          paymentMethod: 'Cash',
          remarks: '',
          eventId: ''
        });
        fetchExpenses();
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${editingId ? 'update' : 'create'} expense record`);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: expense.date.split('T')[0],
      paidTo: expense.vendorName || '',
      paymentMethod: expense.paymentMethod || 'Cash',
      remarks: expense.description || '',
      eventId: expense.eventId || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/expense/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchExpenses();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete expense record');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const canEdit = checkPermission('expense', 'edit');
  const canDelete = checkPermission('expense', 'delete');
  const canCreate = checkPermission('expense', 'create');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const exportData = filteredExpenses.map(expense => {
      const eventName = expense.eventId ? events.find(event => event.id === expense.eventId)?.name || '-' : '-';
      return {
        paidTo: expense.vendorName || '-',
        date: new Date(expense.date).toLocaleDateString(),
        amount: `₹${parseFloat(expense.amount).toLocaleString()}`,
        eventName: eventName
      };
    });
    
    // Create HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Expense Records</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Expense Records Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Records: ${exportData.length}</p>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Paid To</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Event Name</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map((row, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${row.paidTo}</td>
                  <td>${row.date}</td>
                  <td>${row.amount}</td>
                  <td>${row.eventName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p class="total">Total Amount: ₹${filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Sort and filter expenses
  useEffect(() => {
    let processedExpenses = [...expenses];
    
    // Sort first
    processedExpenses.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Then filter
    if (!searchTerm) {
      setFilteredExpenses(processedExpenses);
    } else {
      const filtered = processedExpenses.filter(expense => {
        const eventName = expense.eventId ? events.find(event => event.id === expense.eventId)?.name || '' : '';
        const expenseDate = new Date(expense.date);
        const dateStr = expenseDate.toLocaleDateString();
        const dateStrUS = expenseDate.toLocaleDateString('en-US');
        const dateStrUK = expenseDate.toLocaleDateString('en-GB');
        const isoDate = expense.date.split('T')[0];
        
        return (expense.vendorName && expense.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
               eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               dateStr.includes(searchTerm) ||
               dateStrUS.includes(searchTerm) ||
               dateStrUK.includes(searchTerm) ||
               isoDate.includes(searchTerm);
      });
      setFilteredExpenses(filtered);
      
      // Adjust current page if it exceeds filtered results
      const maxPage = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    }
  }, [expenses, searchTerm, events.length, currentPage, itemsPerPage, sortField, sortDirection]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <PageGuard requiredPage="expense">
      <div className="p-4 pb-20 md:p-8 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Expense Records</h1>
        <div className="flex gap-4 items-center">
          {!showForm && (
            <input
              type="text"
              placeholder="Search by vendor, date, event, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-80"
            />
          )}
          <Permission module="expense" action="export">
            <button
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              🖨️ Print
            </button>
          </Permission>
        <Permission module="expense" action="create">
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  category: 'Maintenance',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  paidTo: '',
                  paymentMethod: 'Cash',
                  remarks: '',
                  eventId: ''
                });
              } else {
                setShowForm(true);
              }
            }}
            className="bg-red-500 text-white px-6 py-3 text-base rounded-lg hover:bg-red-600 min-h-[44px] touch-manipulation"
          >
            {showForm ? 'Cancel' : (editingId ? 'Edit Expense' : 'Add Expense')}
          </button>
        </Permission>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="₹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid To / Vendor
              </label>
              <input
                type="text"
                value={formData.paidTo}
                onChange={(e) => setFormData({...formData, paidTo: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event (Optional)
              </label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">None</option>
                {events
                  .filter(event => !['completed', 'cancelled'].includes(event.status?.toLowerCase()))
                  .map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} {event.status ? `(${event.status})` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 min-h-[44px]"
              >
                {editingId ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Mobile Controls */}
        <div className="block sm:hidden p-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {filteredExpenses.length} records
            </span>
            <button
              onClick={() => setShowCompact(!showCompact)}
              className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded"
            >
              {showCompact ? '📋 Detailed' : '📱 Compact'}
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field);
                setSortDirection(direction);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="vendorName-asc">Paid To (A-Z)</option>
              <option value="vendorName-desc">Paid To (Z-A)</option>
              <option value="amount-desc">Amount (High-Low)</option>
              <option value="amount-asc">Amount (Low-High)</option>
            </select>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredExpenses
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((expense) => (
            <div key={expense.id} className={`border-b border-gray-200 ${showCompact ? 'p-2' : 'p-4'}`}>
              {showCompact ? (
                // Compact View
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{expense.vendorName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()} • ₹{parseFloat(expense.amount).toLocaleString()}
                    </div>
                  </div>
                  <Permission module="expense" action="edit">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="ml-2 text-blue-600 p-1"
                    >
                      ✏️
                    </button>
                  </Permission>
                </div>
              ) : (
                // Detailed View
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{expense.vendorName || 'N/A'}</h3>
                    </div>
                    <span className="text-lg font-semibold text-red-600">
                      ₹{parseFloat(expense.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>📅 {new Date(expense.date).toLocaleDateString()}</div>
                    <div>🎪 {expense.eventId ? (() => {
                      const eventName = events.find(event => event.id === expense.eventId)?.name || '-';
                      return eventName.length > 15 ? eventName.substring(0, 15) + '...' : eventName;
                    })() : '-'}</div>
                    <div className="col-span-2">📝 {expense.description || '-'}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Permission module="expense" action="edit">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                    </Permission>
                    <Permission module="expense" action="delete">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </Permission>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {/* Mobile Pagination */}
          {filteredExpenses.length > itemsPerPage && (
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(filteredExpenses.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredExpenses.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)}
                className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('vendorName')}>
                Paid To {sortField === 'vendorName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {expense.vendorName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{parseFloat(expense.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense.eventId ? 
                    events.find(event => event.id === expense.eventId)?.name || '-' 
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {expense.description || '-'}
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Permission module="expense" action="edit">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="hover:bg-gray-100 p-1 rounded mr-1 text-lg"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    </Permission>
                    <Permission module="expense" action="delete">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="hover:bg-gray-100 p-1 rounded text-lg"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </Permission>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
      </div>
    </PageGuard>
  );
}