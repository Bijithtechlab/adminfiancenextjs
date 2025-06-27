'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { hasAccess } from '../utils/permissions';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', page: 'dashboard' },
    { path: '/income', label: 'Income', icon: '💰', page: 'income' },
    { path: '/expense', label: 'Expense', icon: '💸', page: 'expense' },
    { path: '/events', label: 'Events', icon: '🎉', page: 'events' },
    { path: '/inventory', label: 'Inventory', icon: '📦', page: 'inventory' },
    { path: '/reports', label: 'Reports', icon: '📈', page: 'reports' },
    { path: '/users', label: 'Users', icon: '👥', page: 'users' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('User role from token:', payload.role);
        setUserRole(payload.role);
        setUserName(payload.name || payload.email);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Filter navigation items based on user role
  const accessibleNavItems = navItems.filter(item => {
    const access = hasAccess(userRole, item.page);
    console.log(`Page: ${item.page}, Role: ${userRole}, Access: ${access}`);
    return access;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (pathname === '/login') {
    return null;
  }

  return (
    <div className="hidden md:block bg-white shadow-md mb-6">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex space-x-1">
          {accessibleNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.path
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{userName}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}