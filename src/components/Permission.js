import { usePermissions } from '../hooks/usePermissions';

// Component to conditionally render content based on permissions
export const Permission = ({ module, action = 'view', children, fallback = null }) => {
  const { checkPermission } = usePermissions();
  
  if (checkPermission(module, action)) {
    return children;
  }
  
  return fallback;
};

// Higher-order component for protecting entire components
export const withPermission = (WrappedComponent, module, action = 'view') => {
  return function PermissionWrappedComponent(props) {
    const { checkPermission } = usePermissions();
    
    if (!checkPermission(module, action)) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Access Denied</h3>
            <p>You don&apos;t have permission to access this feature.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Button component with permission checking
export const PermissionButton = ({ 
  module, 
  action, 
  children, 
  className = '', 
  onClick,
  disabled = false,
  ...props 
}) => {
  const { checkPermission } = usePermissions();
  
  const hasAccess = checkPermission(module, action);
  
  if (!hasAccess) {
    return null; // Don't render button if no permission
  }
  
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};