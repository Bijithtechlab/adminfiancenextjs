'use client';
import { useState, useEffect } from 'react';
import PageGuard from '../../components/PageGuard';
import { Permission } from '../../components/Permission';
import { usePermissions } from '../../hooks/usePermissions';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { checkPermission } = usePermissions();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'data-entry'
  });
  const [formKey, setFormKey] = useState(0);

  const roles = [
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'data-entry', label: 'Data Entry' }
  ];

  const roleDescriptions = {
    'admin': 'Full access to all features including user management',
    'manager': 'Access to dashboard, income, expense, events, and inventory',
    'accountant': 'Access to dashboard, income, and expense',
    'data-entry': 'Access to dashboard and income only'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setShowForm(false); // Close first
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'data-entry'
      });
      setFormKey(prev => prev + 1);
      setShowForm(true);
      setError('');
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = dialogMode === 'edit' ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Reset everything first
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'data-entry'
        });
        setSelectedUser(null);
        setDialogMode('create');
        setFormKey(prev => prev + 1);
        setShowForm(false);
        setError('');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${dialogMode} user`);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (user) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role
    });
    setShowForm(true);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <PageGuard requiredPage="users">
      <div className="p-4 pb-20 md:p-8 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        <Permission module="users" action="create">
          <button
            onClick={handleOpenCreateDialog}
            className="bg-blue-500 text-white px-6 py-3 text-base rounded-lg hover:bg-blue-600 min-h-[44px] touch-manipulation"
          >
            Add New User
          </button>
        </Permission>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{dialogMode === 'edit' ? 'Edit User' : 'Add New User'}</h2>
          <form key={formKey} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {dialogMode === 'edit' ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={dialogMode === 'create'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength="6"
                placeholder={dialogMode === 'edit' ? 'Leave blank to keep current password' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Role Permissions:</h4>
                <p className="text-sm text-gray-600">{roleDescriptions[formData.role]}</p>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 min-h-[44px]"
              >
                {dialogMode === 'edit' ? 'Update User' : 'Create User'}
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              {checkPermission('users', 'delete') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'accountant' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                {checkPermission('users', 'delete') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Get current user ID from token */}
                    {(() => {
                      const token = localStorage.getItem('token');
                      const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
                      const isOwnAccount = currentUserId === user.id;
                      
                      return (
                        <>
                          {!isOwnAccount && (
                            <button
                              onClick={() => handleEdit(user)}
                              className="hover:bg-gray-100 p-1 rounded mr-1 text-lg"
                              title="Edit User"
                            >
                              ✏️
                            </button>
                          )}
                          {!isOwnAccount && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="hover:bg-gray-100 p-1 rounded text-lg"
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          )}
                          {isOwnAccount && (
                            <span className="text-gray-400 text-sm">Own Account</span>
                          )}
                        </>
                      );
                    })()}
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