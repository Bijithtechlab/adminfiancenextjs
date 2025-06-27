import { useState, useEffect } from 'react';
import { hasPermission, getAccessiblePages, getRoleLevel, getNormalizedRole } from '../utils/permissions';

export const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenVersion, setTokenVersion] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        setUserId(payload.id);
      } catch (error) {
        console.error('Error parsing token:', error);
        setUserRole(null);
        setUserId(null);
      }
    } else {
      setUserRole(null);
      setUserId(null);
    }
    
    setLoading(false);
  }, [tokenVersion]);

  // Listen for storage changes (when user logs in/out)
  useEffect(() => {
    const handleStorageChange = () => {
      setTokenVersion(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom token change events
    window.addEventListener('tokenChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenChanged', handleStorageChange);
    };
  }, []);

  const checkPermission = (module, action = 'view') => {
    return hasPermission(userRole, module, action);
  };

  const getAccessibleModules = () => {
    return getAccessiblePages(userRole);
  };

  const getUserRoleLevel = () => {
    return getRoleLevel(userRole);
  };

  return {
    userRole: getNormalizedRole(userRole), // Return normalized role for display
    rawUserRole: userRole, // Keep raw role for debugging
    userId,
    loading,
    checkPermission,
    getAccessibleModules,
    getUserRoleLevel,
    hasPermission: checkPermission, // alias for backward compatibility
    refreshPermissions: () => setTokenVersion(prev => prev + 1) // Manual refresh function
  };
};