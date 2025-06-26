'use client';
import { useState, useEffect } from 'react';
import PageGuard from '../../components/PageGuard';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'Pieces',
    description: '',
    purchaseDate: '',
    purchasePrice: ''
  });

  const inventoryCategories = [
    'Pooja Items',
    'Lamps',
    'Food Grains',
    'Utensils',
    'Furniture',
    'Electronics',
    'Decorations',
    'Other'
  ];

  const unitOptions = [
    'Pieces',
    'Kg',
    'Grams',
    'Liters',
    'Sets',
    'Boxes',
    'Packets',
    'Other'
  ];

  useEffect(() => {
    fetchInventory();
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

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      } else {
        setError('Failed to fetch inventory items');
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
      const url = editingId ? `/api/inventory/${editingId}` : '/api/inventory';
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
          quantity: '1',
          unit: 'Pieces',
          description: '',
          purchaseDate: '',
          purchasePrice: ''
        });
        fetchInventory();
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${editingId ? 'update' : 'create'} inventory item`);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      description: item.description || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      purchasePrice: item.value ? item.value.toString() : ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchInventory();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete inventory item');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const canEditDelete = userRole === 'Admin' || userRole === 'Manager' || userRole === 'admin' || userRole === 'manager';

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <PageGuard requiredPage="inventory">
      <div className="p-4 pb-20 md:p-8 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setFormData({
                name: '',
                quantity: '1',
                unit: 'Pieces',
                description: '',
                purchaseDate: '',
                purchasePrice: ''
              });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-green-500 text-white px-6 py-3 text-base rounded-lg hover:bg-green-600 min-h-[44px] touch-manipulation"
        >
          {showForm ? 'Cancel' : (editingId ? 'Edit Item' : 'Add Item')}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date (Optional)
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="₹"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 min-h-[44px]"
              >
                {editingId ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mobile-table">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              {canEditDelete && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.value ? `₹${parseFloat(item.value).toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {item.description || '-'}
                </td>
                {canEditDelete && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="hover:bg-gray-100 p-1 rounded mr-1 text-lg"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
    </PageGuard>
  );
}