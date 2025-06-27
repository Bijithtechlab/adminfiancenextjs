'use client';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission, PermissionButton } from '../../components/Permission';
import { PERMISSIONS, ROLE_DESCRIPTIONS, getRoleColor } from '../../utils/permissions';

export default function TestPermissionsPage() {
  const { userRole, checkPermission } = usePermissions();

  const modules = Object.keys(PERMISSIONS);
  const actions = ['view', 'create', 'edit', 'delete', 'export', 'manage_roles'];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Permission Testing Page</h1>
        <div className="flex items-center gap-2">
          <span>Current Role:</span>
          <span className={`px-3 py-1 rounded-full text-sm ${getRoleColor(userRole)}`}>
            {userRole || 'Not logged in'}
          </span>
        </div>
        {userRole && (
          <p className="text-sm text-gray-600 mt-2">
            {ROLE_DESCRIPTIONS[userRole]}
          </p>
        )}
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Permissions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 border-b font-medium">Module</th>
                {actions.map(action => (
                  <th key={action} className="text-center py-2 px-2 border-b font-medium capitalize">
                    {action.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <tr key={module}>
                  <td className="py-2 px-3 border-b font-medium capitalize">{module}</td>
                  {actions.map(action => {
                    const hasAccess = checkPermission(module, action);
                    return (
                      <td key={action} className="text-center py-2 px-2 border-b">
                        <span className={`inline-block w-4 h-4 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-300'}`} title={hasAccess ? 'Allowed' : 'Denied'}></span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-2"></span> Allowed
          <span className="inline-block w-4 h-4 rounded-full bg-red-300 mr-2"></span> Denied
        </div>
      </div>

      {/* Component Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Module Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Income Module Test</h3>
          <div className="space-y-2">
            <Permission module="income" action="view">
              <div className="text-green-600">✅ You can view income records</div>
            </Permission>
            <Permission module="income" action="view" fallback={<div className="text-red-600">❌ You cannot view income records</div>}>
              <div></div>
            </Permission>

            <Permission module="income" action="create">
              <div className="text-green-600">✅ You can create income records</div>
            </Permission>
            <Permission module="income" action="create" fallback={<div className="text-red-600">❌ You cannot create income records</div>}>
              <div></div>
            </Permission>

            <div className="mt-4">
              <PermissionButton
                module="income"
                action="create"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Income (Only visible if you have permission)
              </PermissionButton>
            </div>

            <div className="mt-2">
              <PermissionButton
                module="income"
                action="delete"
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete Income (Only visible if you have permission)
              </PermissionButton>
            </div>
          </div>
        </div>

        {/* Users Module Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Users Module Test</h3>
          <div className="space-y-2">
            <Permission module="users" action="view">
              <div className="text-green-600">✅ You can view users</div>
            </Permission>
            <Permission module="users" action="view" fallback={<div className="text-red-600">❌ You cannot view users</div>}>
              <div></div>
            </Permission>

            <Permission module="users" action="manage_roles">
              <div className="text-green-600">✅ You can manage user roles</div>
            </Permission>
            <Permission module="users" action="manage_roles" fallback={<div className="text-red-600">❌ You cannot manage user roles</div>}>
              <div></div>
            </Permission>

            <div className="mt-4">
              <PermissionButton
                module="users"
                action="create"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add User (Only visible if you have permission)
              </PermissionButton>
            </div>

            <div className="mt-2">
              <PermissionButton
                module="users"
                action="manage_roles"
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Manage Roles (Only visible if you have permission)
              </PermissionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}