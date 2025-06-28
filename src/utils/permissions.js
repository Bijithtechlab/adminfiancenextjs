// Enhanced Role-Based Access Control System

// Define roles hierarchy (higher number = more permissions)
export const ROLES = {
  'Super Admin': 5,
  'Admin': 4,
  'Manager': 3,
  'Accountant': 2,
  'Data Entry': 1,
  'Viewer': 0
};

// Define permissions for each module
export const PERMISSIONS = {
  // Dashboard permissions
  dashboard: {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry', 'Viewer'],
    export: ['Super Admin', 'Admin', 'Manager', 'Accountant']
  },
  
  // Income permissions
  income: {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry', 'Viewer'],
    create: ['Super Admin', 'Admin', 'Manager', 'Data Entry'],
    edit: ['Super Admin', 'Admin', 'Manager'],
    delete: ['Super Admin', 'Admin'],
    export: ['Super Admin', 'Admin', 'Manager', 'Accountant']
  },
  
  // Expense permissions
  expense: {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry', 'Viewer'],
    create: ['Super Admin', 'Admin', 'Manager', 'Data Entry'],
    edit: ['Super Admin', 'Admin', 'Manager'],
    delete: ['Super Admin', 'Admin'],
    export: ['Super Admin', 'Admin', 'Manager', 'Accountant']
  },
  
  // Events permissions
  events: {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry', 'Viewer'],
    create: ['Super Admin', 'Admin', 'Manager'],
    edit: ['Super Admin', 'Admin', 'Manager'],
    delete: ['Super Admin', 'Admin'],
    export: ['Super Admin', 'Admin', 'Manager']
  },
  
  // Inventory permissions
  inventory: {
    view: ['Super Admin', 'Admin', 'Manager', 'Viewer'],
    create: ['Super Admin', 'Admin', 'Manager'],
    edit: ['Super Admin', 'Admin', 'Manager'],
    delete: ['Super Admin', 'Admin'],
    export: ['Super Admin', 'Admin', 'Manager']
  },
  
  // Reports permissions
  reports: {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant'],
    export: ['Super Admin', 'Admin', 'Manager', 'Accountant'],
    financial: ['Super Admin', 'Admin', 'Manager', 'Accountant'],
    audit: ['Super Admin', 'Admin']
  },
  
  // Address Book permissions
  'address-book': {
    view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry'],
    create: ['Super Admin', 'Admin', 'Manager', 'Data Entry'],
    edit: ['Super Admin', 'Admin', 'Manager'],
    delete: ['Super Admin', 'Admin']
  },
  
  // Users permissions
  users: {
    view: ['Super Admin', 'Admin'],
    create: ['Super Admin'],
    edit: ['Super Admin'],
    delete: ['Super Admin'],
    manage_roles: ['Super Admin']
  }
};

// Normalize role names to handle database inconsistencies
const normalizeRole = (role) => {
  const roleMap = {
    'data-entry': 'Data Entry',
    'accountant': 'Accountant',
    'manager': 'Manager',
    'admin': 'Admin',
    'super-admin': 'Super Admin',
    'viewer': 'Viewer'
  };
  
  return roleMap[role?.toLowerCase()] || role;
};

// Check if user has permission for a specific action
export const hasPermission = (userRole, module, action = 'view') => {
  const normalizedRole = normalizeRole(userRole);
  
  if (!normalizedRole || !PERMISSIONS[module] || !PERMISSIONS[module][action]) {
    return false;
  }
  
  return PERMISSIONS[module][action].includes(normalizedRole);
};

// Check if user has access to a page (backward compatibility)
export const hasAccess = (userRole, page) => {
  return hasPermission(userRole, page, 'view');
};

// Get all accessible pages for a role
export const getAccessiblePages = (userRole) => {
  const pages = [];
  
  Object.keys(PERMISSIONS).forEach(module => {
    if (hasPermission(userRole, module, 'view')) {
      pages.push(module);
    }
  });
  
  return pages;
};

// Get user's role level for hierarchy comparison
export const getRoleLevel = (userRole) => {
  const normalizedRole = normalizeRole(userRole);
  return ROLES[normalizedRole] || 0;
};

// Check if user can manage another user (based on role hierarchy)
export const canManageUser = (currentUserRole, targetUserRole) => {
  return getRoleLevel(currentUserRole) > getRoleLevel(targetUserRole);
};

// Get available roles that current user can assign
export const getAssignableRoles = (currentUserRole) => {
  const currentLevel = getRoleLevel(currentUserRole);
  const assignableRoles = [];
  
  Object.entries(ROLES).forEach(([role, level]) => {
    if (level < currentLevel) {
      assignableRoles.push(role);
    }
  });
  
  return assignableRoles;
};

// Role descriptions for UI
export const ROLE_DESCRIPTIONS = {
  'Super Admin': 'Full system access including user management and system settings',
  'Admin': 'Full access to all modules except user role management',
  'Manager': 'Can manage income, expenses, events, and view reports',
  'Accountant': 'Can view all data and generate financial reports',
  'Data Entry': 'Can add income and expense records and view basic information',
  'Viewer': 'Read-only access to basic information'
};

// Get role color for UI display
export const getRoleColor = (role) => {
  const normalizedRole = normalizeRole(role);
  const colors = {
    'Super Admin': 'bg-purple-100 text-purple-800',
    'Admin': 'bg-red-100 text-red-800',
    'Manager': 'bg-blue-100 text-blue-800',
    'Accountant': 'bg-green-100 text-green-800',
    'Data Entry': 'bg-yellow-100 text-yellow-800',
    'Viewer': 'bg-gray-100 text-gray-800'
  };
  
  return colors[normalizedRole] || 'bg-gray-100 text-gray-800';
};

// Get normalized role name for display
export const getNormalizedRole = (role) => {
  return normalizeRole(role);
};