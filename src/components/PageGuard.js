'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAccess } from '../utils/rolePermissions';

export default function PageGuard({ children, requiredPage }) {
  const [hasPageAccess, setHasPageAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;
      
      if (hasAccess(userRole, requiredPage)) {
        setHasPageAccess(true);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      router.push('/login');
    }
    
    setLoading(false);
  }, [requiredPage, router]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!hasPageAccess) {
    return null;
  }

  return children;
}