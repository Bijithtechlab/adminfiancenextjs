import { NextResponse } from 'next/server';
const db = require('../../../../../lib/db');
const { verifyToken } = require('../../../../../utils/auth');
const { hasPermission, canManageUser } = require('../../../../../utils/permissions');

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    const { id: targetUserId } = params;
    const { role: newRole } = await request.json();

    // Check if current user has permission to manage roles
    if (!hasPermission(currentUser.role, 'users', 'manage_roles')) {
      return NextResponse.json(
        { message: 'You do not have permission to manage user roles' },
        { status: 403 }
      );
    }

    // Get target user's current role
    const targetUserQuery = 'SELECT role FROM users WHERE id = $1';
    const targetUserResult = await db.query(targetUserQuery, [targetUserId]);
    
    if (targetUserResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const targetUserCurrentRole = targetUserResult.rows[0].role;

    // Check if current user can manage the target user (role hierarchy)
    if (!canManageUser(currentUser.role, targetUserCurrentRole)) {
      return NextResponse.json(
        { message: 'You cannot manage users with equal or higher roles' },
        { status: 403 }
      );
    }

    // Check if current user can assign the new role
    if (!canManageUser(currentUser.role, newRole)) {
      return NextResponse.json(
        { message: 'You cannot assign roles equal to or higher than your own' },
        { status: 403 }
      );
    }

    // Update user role
    const updateQuery = 'UPDATE users SET role = $1, updated_at = $2 WHERE id = $3 RETURNING *';
    const timestamp = new Date().toISOString();
    const result = await db.query(updateQuery, [newRole, timestamp, targetUserId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { message: 'Could not update user role', error: error.message },
      { status: 500 }
    );
  }
}