'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { hasAccess, hasPermission } from '../utils/permissions';

export default function MobileNav() {
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
    { path: '/address-book', label: 'Address Book', icon: '📞', page: 'address-book' },
    { path: '/reports', label: 'Reports', icon: '📈', page: 'reports' },
    { path: '/users', label: 'Users', icon: '👥', page: 'users' },
    { path: '/roles', label: 'Roles', icon: '🔐', page: 'users', action: 'manage_roles' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Mobile nav - User role from token:', payload.role);
        setUserRole(payload.role);
        setUserName(payload.name || payload.email);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Force page reload to ensure clean state
    window.location.href = '/login';
  };

  if (pathname === '/login') {
    return null;
  }

  return (
    <div className="mobile-nav md:hidden">
      {navItems
        .filter(item => {
          if (item.action) {
            return hasPermission(userRole, item.page, item.action);
          }
          const access = hasAccess(userRole, item.page);
          console.log(`Mobile - Page: ${item.page}, Role: ${userRole}, Access: ${access}`);
          return access;
        })
        .map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`mobile-nav-item ${
            pathname === item.path ? 'text-blue-600 bg-blue-50' : ''
          }`}
        >
          <span className="text-lg mb-1">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <button
        onClick={handleLogout}
        className="mobile-nav-item text-red-600"
      >
        <span className="text-lg mb-1">🚪</span>
        <span>Logout</span>
      </button>
    </div>
  );
}