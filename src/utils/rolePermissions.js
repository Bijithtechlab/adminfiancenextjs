// Role-based permissions
export const rolePermissions = {
  'admin': ['dashboard', 'income', 'expense', 'events', 'inventory', 'reports', 'users'],
  'Admin': ['dashboard', 'income', 'expense', 'events', 'inventory', 'reports', 'users'],
  'manager': ['dashboard', 'income', 'expense', 'events', 'inventory', 'reports'],
  'Manager': ['dashboard', 'income', 'expense', 'events', 'inventory', 'reports'],
  'accountant': ['dashboard', 'income', 'expense', 'reports'],
  'Accountant': ['dashboard', 'income', 'expense', 'reports'],
  'data-entry': ['dashboard', 'income'],
  'Data Entry': ['dashboard', 'income']
};

export const hasAccess = (userRole, page) => {
  console.log(`hasAccess check - Role: ${userRole}, Page: ${page}`);
  if (!userRole || !rolePermissions[userRole]) {
    console.log('No role or invalid role');
    return false;
  }
  const hasPermission = rolePermissions[userRole].includes(page);
  console.log(`Permission result: ${hasPermission}`);
  return hasPermission;
};

export const getAccessiblePages = (userRole) => {
  return rolePermissions[userRole] || [];
};