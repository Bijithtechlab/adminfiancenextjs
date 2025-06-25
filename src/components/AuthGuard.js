'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasAccess } from '../utils/rolePermissions';

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        localStorage.removeItem('token');
        router.push('/login');
        setLoading(false);
        return;
      }

      setUserRole(payload.role);
      setIsAuthenticated(true);

      // Check page access
      const currentPage = pathname.substring(1) || 'dashboard';
      if (currentPage !== 'login' && !hasAccess(payload.role, currentPage)) {
        router.push('/dashboard');
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }
    
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (pathname === '/login') {
    return children;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}