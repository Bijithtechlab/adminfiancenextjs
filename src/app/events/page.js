'use client';
import { useState, useEffect } from 'react';
import PageGuard from '../../components/PageGuard';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showCompact, setShowCompact] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // Tomorrow
    budget: '',
    type: 'general',
    status: 'planned'
  });

  const eventTypes = [
    'general',
    'festival', 
    'pooja',
    'celebration',
    'meeting',
    'other'
  ];

  const eventStatuses = [
    'planned',
    'in progress',
    'completed',
    'cancelled'
  ];

  useEffect(() => {
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
        setEvents(data.events);
        setFilteredEvents(data.events);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/events/${editingId}` : '/api/events';
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
          name: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
          budget: '',
          type: 'general',
          status: 'planned'
        });
        fetchEvents();
        setError('');
      } else {
        const data = await response.json();
        console.error('Server error:', data);
        setError(data.message || `Failed to ${editingId ? 'update' : 'create'} event`);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (event) => {
    setFormData({
      name: event.name,
      description: event.description || '',
      startDate: event.startDate ? event.startDate.split('T')[0] : event.date.split('T')[0],
      endDate: event.endDate ? event.endDate.split('T')[0] : event.date.split('T')[0],
      budget: event.budget || '',
      type: event.type || 'general',
      status: event.status || 'planned'
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete event');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const canEditDelete = userRole === 'Admin' || userRole === 'Manager' || userRole === 'admin' || userRole === 'manager';

  // Filter events based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => {
        const startDate = new Date(event.startDate || event.date);
        const endDate = event.endDate ? new Date(event.endDate) : null;
        const startDateStr = startDate.toLocaleDateString();
        const startDateStrUS = startDate.toLocaleDateString('en-US');
        const startDateStrUK = startDate.toLocaleDateString('en-GB');
        const startIsoDate = (event.startDate || event.date).split('T')[0];
        
        let endDateMatches = false;
        if (endDate) {
          const endDateStr = endDate.toLocaleDateString();
          const endDateStrUS = endDate.toLocaleDateString('en-US');
          const endDateStrUK = endDate.toLocaleDateString('en-GB');
          const endIsoDate = event.endDate.split('T')[0];
          endDateMatches = endDateStr.includes(searchTerm) ||
                          endDateStrUS.includes(searchTerm) ||
                          endDateStrUK.includes(searchTerm) ||
                          endIsoDate.includes(searchTerm);
        }
        
        return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (event.status && event.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
               startDateStr.includes(searchTerm) ||
               startDateStrUS.includes(searchTerm) ||
               startDateStrUK.includes(searchTerm) ||
               startIsoDate.includes(searchTerm) ||
               endDateMatches;
      });
      setFilteredEvents(filtered);
      
      // Adjust current page if it exceeds filtered results
      const maxPage = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    }
  }, [events, searchTerm, currentPage, itemsPerPage]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <PageGuard requiredPage="events">
      <div className="p-4 pb-20 md:p-8 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
          {!showForm && (
            <input
              type="text"
              placeholder="Search by name, date, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          )}
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setFormData({
                name: '',
                description: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
                budget: '',
                type: 'general',
                status: 'planned'
              });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-purple-500 text-white px-6 py-3 text-base rounded-lg hover:bg-purple-600 min-h-[44px] touch-manipulation"
        >
          {showForm ? 'Cancel' : (editingId ? 'Edit Event' : 'Add Event')}
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
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Event' : 'Add New Event'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate}
                  className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {eventStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="₹"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="4"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 min-h-[44px]"
              >
                {editingId ? 'Update Event' : 'Save Event'}
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
              {filteredEvents.length} events • Page {currentPage}
            </span>
            <button
              onClick={() => setShowCompact(!showCompact)}
              className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded"
            >
              {showCompact ? '📋 Detailed' : '📱 Compact'}
            </button>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredEvents
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((event) => (
            <div key={event.id} className={`border-b border-gray-200 ${showCompact ? 'p-2' : 'p-4'}`}>
              {showCompact ? (
                // Compact View
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{event.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.startDate || event.date).toLocaleDateString()}{event.endDate && event.endDate !== (event.startDate || event.date) ? ` - ${new Date(event.endDate).toLocaleDateString()}` : ''} • ₹{parseFloat(event.balance || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                    </span>
                    {canEditDelete && (
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-blue-600 p-1"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Detailed View
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div className="mb-1">📅 {new Date(event.startDate || event.date).toLocaleDateString()}{event.endDate && event.endDate !== (event.startDate || event.date) ? ` - ${new Date(event.endDate).toLocaleDateString()}` : ''}</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span>💰 ₹{event.budget ? parseFloat(event.budget).toLocaleString() : '0'}</span>
                      <span className="text-green-600">💵 ₹{parseFloat(event.total_income || 0).toLocaleString()}</span>
                      <span className="text-red-600">💸 ₹{parseFloat(event.total_expense || 0).toLocaleString()}</span>
                      <span className={parseFloat(event.balance || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>⚖️ ₹{parseFloat(event.balance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {canEditDelete && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
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
          {filteredEvents.length > itemsPerPage && (
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-purple-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(filteredEvents.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEvents.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredEvents.length / itemsPerPage)}
                className="px-3 py-1 bg-purple-500 text-white rounded disabled:bg-gray-300 text-sm"
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
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Income
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              {canEditDelete && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  <div className="font-medium">{event.name}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(event.startDate || event.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.endDate ? new Date(event.endDate).toLocaleDateString() : new Date(event.startDate || event.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.status === 'completed' ? 'bg-green-100 text-green-800' :
                    event.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.budget ? `₹${parseFloat(event.budget).toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                  ₹{parseFloat(event.total_income || 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                  ₹{parseFloat(event.total_expense || 0).toLocaleString()}
                </td>
                <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
                  parseFloat(event.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{parseFloat(event.balance || 0).toLocaleString()}
                </td>
                {canEditDelete && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(event)}
                      className="hover:bg-gray-100 p-1 rounded mr-1 text-lg"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
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
        
        {/* Desktop Pagination */}
        {filteredEvents.length > itemsPerPage && (
          <div className="hidden sm:flex justify-between items-center p-4 bg-gray-50">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
            >
              ← Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {Math.ceil(filteredEvents.length / itemsPerPage)} ({filteredEvents.length} events)
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEvents.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(filteredEvents.length / itemsPerPage)}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
            >
              Next →
            </button>
          </div>
        )}
        </div>
      </div>
    </PageGuard>
  );
}