'use client';
import { useState, useEffect } from 'react';

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    donorName: '',
    houseName: '',
    address: '',
    phoneNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    donationType: 'general',
    eventId: '',
    receiptNumber: ''
  });
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showCompact, setShowCompact] = useState(true);

  useEffect(() => {
    fetchIncomes();
    fetchEvents();
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        setUserRole(payload.role);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

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

  const fetchIncomes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/income', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIncomes(data.incomes);
        setFilteredIncomes(data.incomes);
      } else {
        setError('Failed to fetch income records');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/income/${editingId}` : '/api/income';
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
          donorName: '',
          houseName: '',
          address: '',
          phoneNumber: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          donationType: 'general',
          eventId: '',
          receiptNumber: ''
        });
        fetchIncomes();
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${editingId ? 'update' : 'create'} income record`);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (income) => {
    setFormData({
      donorName: income.donorName,
      houseName: income.houseName || '',
      address: income.address || '',
      phoneNumber: income.phoneNumber || '',
      amount: income.amount,
      date: income.date.split('T')[0],
      description: income.description || '',
      donationType: income.donationType,
      eventId: income.eventId || '',
      receiptNumber: income.receiptNumber || ''
    });
    setEditingId(income.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchIncomes();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete income record');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const canEditDelete = userRole === 'Admin' || userRole === 'Manager' || userRole === 'admin' || userRole === 'manager';

  // Filter incomes based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredIncomes(incomes);
    } else {
      const filtered = incomes.filter(income => 
        income.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (income.houseName && income.houseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        income.donationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (income.receiptNumber && income.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredIncomes(filtered);
    }
  }, [incomes, searchTerm]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income Records</h1>
        <div className="flex gap-4 items-center">
          {!showForm && (
            <input
              type="text"
              placeholder="Search by donor, house, type, or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          )}
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setFormData({
                donorName: '',
                houseName: '',
                address: '',
                phoneNumber: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                donationType: 'general',
                eventId: '',
                receiptNumber: ''
              });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : (editingId ? 'Edit Income' : 'Add Income')}
        </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Income' : 'Add New Income'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Donor Name *
              </label>
              <input
                type="text"
                required
                value={formData.donorName}
                onChange={(e) => setFormData({...formData, donorName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Name
              </label>
              <input
                type="text"
                value={formData.houseName}
                onChange={(e) => setFormData({...formData, houseName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Donation Type
              </label>
              <select
                value={formData.donationType}
                onChange={(e) => setFormData({...formData, donationType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="general">General Donation</option>
                <option value="pooja">Pooja Offering</option>
                <option value="festival">Festival Donation</option>
                <option value="construction">Construction Fund</option>
                <option value="maintenance">Maintenance Fund</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">None</option>
                {events
                  .filter(event => !['completed', 'cancelled'].includes(event.status?.toLowerCase()))
                  .map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({new Date(event.date).toLocaleDateString()}) {event.status ? `[${event.status}]` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Number
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows="3"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                {editingId ? 'Update Income' : 'Save Income'}
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
              {filteredIncomes.length} records
            </span>
            <button
              onClick={() => setShowCompact(!showCompact)}
              className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded"
            >
              {showCompact ? '📋 Detailed' : '📱 Compact'}
            </button>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredIncomes
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((income) => (
            <div key={income.id} className={`border-b border-gray-200 ${showCompact ? 'p-2' : 'p-4'}`}>
              {showCompact ? (
                // Compact View
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{income.donorName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(income.date).toLocaleDateString()} • ₹{parseFloat(income.amount).toLocaleString()}
                    </div>
                  </div>
                  {canEditDelete && (
                    <button
                      onClick={() => handleEdit(income)}
                      className="ml-2 text-blue-600 p-1"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              ) : (
                // Detailed View
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{income.donorName}</h3>
                      <p className="text-sm text-gray-500">{income.houseName || ''}</p>
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      ₹{parseFloat(income.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>🏠 {income.houseName || '-'}</div>
                    <div>📞 {income.phoneNumber || '-'}</div>
                    <div>📅 {new Date(income.date).toLocaleDateString()}</div>
                    <div>🎪 {income.eventId ? events.find(event => event.id === income.eventId)?.name || '-' : '-'}</div>
                    <div className="col-span-2">🧾 {income.receiptNumber || '-'}</div>
                  </div>
                  {canEditDelete && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(income)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          {/* Mobile Pagination */}
          {filteredIncomes.length > itemsPerPage && (
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(filteredIncomes.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredIncomes.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredIncomes.length / itemsPerPage)}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt #
              </th>
              {canEditDelete && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIncomes.map((income) => (
              <tr key={income.id}>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  <div className="font-medium">{income.donorName}</div>
                  <div className="text-xs text-gray-500">{income.houseName || ''}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {income.phoneNumber || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{parseFloat(income.amount).toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(income.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {income.eventId ? 
                    events.find(event => event.id === income.eventId)?.name || '-' 
                    : '-'
                  }
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {income.receiptNumber || '-'}
                </td>
                {canEditDelete && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(income)}
                      className="hover:bg-gray-100 p-1 rounded mr-1 text-lg"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="hover:bg-gray-100 p-1 rounded text-lg"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}