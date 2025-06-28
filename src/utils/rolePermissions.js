// Role-based permissions
export const rolePermissions = {
  'admin': ['dashboard', 'income', 'expense', 'events', 'inventory', 'address-book', 'reports', 'users'],
  'Admin': ['dashboard', 'income', 'expense', 'events', 'inventory', 'address-book', 'reports', 'users'],
  'manager': ['dashboard', 'income', 'expense', 'events', 'inventory', 'address-book', 'reports'],
  'Manager': ['dashboard', 'income', 'expense', 'events', 'inventory', 'address-book', 'reports'],
  'accountant': ['dashboard', 'income', 'expense', 'address-book', 'reports'],
  'Accountant': ['dashboard', 'income', 'expense', 'address-book', 'reports'],
  'data-entry': ['dashboard', 'income', 'address-book'],
  'Data Entry': ['dashboard', 'income', 'address-book']
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