# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This temple finance application now includes a comprehensive role-based access control system that manages user permissions at both the UI and API levels.

## Role Hierarchy

### 1. Super Admin (Level 5)
- **Full system access**
- Can manage all users and assign any role
- Access to all modules and actions
- Can manage system settings

### 2. Admin (Level 4)
- **Full access to all modules**
- Can manage users but cannot assign Super Admin role
- Cannot manage other Admins
- Full CRUD operations on all data

### 3. Manager (Level 3)
- **Operational management access**
- Can manage income, expenses, events, and inventory
- Can view and export reports
- Cannot manage users or roles

### 4. Accountant (Level 2)
- **Financial data access**
- Can view all financial data
- Can generate and export reports
- Cannot create/edit/delete records

### 5. Data Entry (Level 1)
- **Limited data entry access**
- Can add income records
- Can view basic dashboard information
- Cannot access expenses or advanced features

### 6. Viewer (Level 0)
- **Read-only access**
- Can view basic information only
- Cannot perform any create/edit/delete operations

## Permission Structure

### Module-Level Permissions
Each module has specific actions that can be controlled:

```javascript
// Example: Income module permissions
income: {
  view: ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry', 'Viewer'],
  create: ['Super Admin', 'Admin', 'Manager', 'Data Entry'],
  edit: ['Super Admin', 'Admin', 'Manager'],
  delete: ['Super Admin', 'Admin'],
  export: ['Super Admin', 'Admin', 'Manager', 'Accountant']
}
```

## Implementation Components

### 1. Permission Utilities (`src/utils/permissions.js`)
- **ROLES**: Defines role hierarchy
- **PERMISSIONS**: Module-action permission matrix
- **hasPermission()**: Check if user has specific permission
- **canManageUser()**: Check role hierarchy for user management

### 2. Permission Hook (`src/hooks/usePermissions.js`)
- **usePermissions()**: React hook for permission checking
- Provides user role and permission checking functions
- Handles token parsing and role extraction

### 3. Permission Components (`src/components/Permission.js`)
- **Permission**: Conditional rendering component
- **PermissionButton**: Button with built-in permission checking
- **withPermission**: Higher-order component for page protection

### 4. API-Level Protection
- All API endpoints validate user permissions
- Role hierarchy enforced for user management
- Prevents unauthorized access at the server level

## Usage Examples

### 1. Conditional Rendering
```jsx
<Permission module="income" action="create">
  <button>Add Income</button>
</Permission>
```

### 2. Permission Button
```jsx
<PermissionButton 
  module="expense" 
  action="delete"
  className="btn-danger"
  onClick={handleDelete}
>
  Delete Expense
</PermissionButton>
```

### 3. Hook Usage
```jsx
const { checkPermission, userRole } = usePermissions();

if (checkPermission('users', 'manage_roles')) {
  // Show role management interface
}
```

### 4. Page Protection
```jsx
<PageGuard requiredPage="users">
  <UsersPage />
</PageGuard>
```

## Role Management

### Admin Interface
- **Role Management Page**: `/roles`
- View all users and their current roles
- Change user roles (within hierarchy limits)
- View permission matrix
- Role descriptions and capabilities

### API Endpoints
- **GET /api/users**: List all users (Admin+ only)
- **PUT /api/users/[id]/role**: Update user role (Super Admin only)

## Security Features

### 1. Role Hierarchy Enforcement
- Users can only manage users with lower-level roles
- Cannot assign roles equal to or higher than their own
- Prevents privilege escalation

### 2. API-Level Validation
- All endpoints check user permissions
- JWT token validation on every request
- Role-based access control at the database level

### 3. UI-Level Protection
- Components conditionally render based on permissions
- Navigation items filtered by user role
- Form actions disabled for unauthorized users

## Testing the System

### Test Page
Visit `/test-permissions` to see:
- Your current role and permissions
- Permission matrix for all modules
- Interactive component testing
- Role descriptions and capabilities

### Testing Different Roles
1. Create users with different roles
2. Login with each user
3. Observe different UI elements and capabilities
4. Test API endpoints with different permission levels

## Migration from Old System

### Backward Compatibility
- Old role checking (`canEditDelete`) still works
- Gradual migration to new permission system
- Existing user roles are preserved

### Updated Pages
- **Income Page**: Uses new permission components
- **Expense Page**: Enhanced with action-level permissions
- **Events Page**: Role-based create/edit/delete controls
- **Users Page**: Role management interface

## Best Practices

### 1. Always Use Permission Components
```jsx
// Good
<Permission module="income" action="edit">
  <EditButton />
</Permission>

// Avoid direct role checking
{userRole === 'Admin' && <EditButton />}
```

### 2. API Endpoint Protection
```javascript
// Always validate permissions in API routes
if (!hasPermission(user.role, 'income', 'create')) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
}
```

### 3. Granular Permissions
- Use specific actions (create, edit, delete) instead of generic access
- Implement least-privilege principle
- Regular permission audits

## Future Enhancements

### 1. Custom Permissions
- User-specific permission overrides
- Temporary permission grants
- Time-based access controls

### 2. Audit Logging
- Track permission changes
- Log access attempts
- User activity monitoring

### 3. Advanced Features
- Multi-tenant role isolation
- Dynamic permission loading
- Integration with external auth systems

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check user role and permission matrix
2. **Components Not Rendering**: Verify permission module/action names
3. **API Errors**: Ensure proper token and role validation

### Debug Tools
- Use `/test-permissions` page for testing
- Check browser console for permission logs
- Verify JWT token payload in browser dev tools

This role-based access control system provides a secure, scalable foundation for managing user permissions in your temple finance application.