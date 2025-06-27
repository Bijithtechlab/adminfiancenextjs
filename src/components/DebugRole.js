'use client';
import { useEffect, useState } from 'react';
import { getNormalizedRole } from '../utils/permissions';

export default function DebugRole() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(payload);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  if (!userInfo) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded text-sm z-50">
      <div><strong>Debug Info:</strong></div>
      <div>Email: {userInfo.email}</div>
      <div>Raw Role: {userInfo.role}</div>
      <div>Normalized Role: {getNormalizedRole(userInfo.role)}</div>
      <div>ID: {userInfo.id}</div>
    </div>
  );
}