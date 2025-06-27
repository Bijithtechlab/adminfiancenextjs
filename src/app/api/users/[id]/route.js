import { NextResponse } from 'next/server';
const db = require('../../../../lib/db');
const { verifyToken, hashPassword } = require('../../../../utils/auth');
const { hasPermission, canManageUser } = require('../../../../utils/permissions');

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return verifyToken(token);
}

// Update user
export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    const { id: targetUserId } = params;
    const { name, email, password, role } = await request.json();

    // Check if current user has permission to edit users
    if (!hasPermission(currentUser.role, 'users', 'edit')) {
      return NextResponse.json(
        { message: 'You do not have permission to edit users' },
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
        { message: 'You cannot edit users with equal or higher roles' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }

    if (role) {
      // Check if current user can assign the new role
      if (!canManageUser(currentUser.role, role)) {
        return NextResponse.json(
          { message: 'You cannot assign roles equal to or higher than your own' },
          { status: 403 }
        );
      }
      updateFields.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    values.push(targetUserId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, created_at, updated_at`;
    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { message: 'Could not update user', error: error.message },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    const { id: targetUserId } = params;

    // Check if current user has permission to delete users
    if (!hasPermission(currentUser.role, 'users', 'delete')) {
      return NextResponse.json(
        { message: 'You do not have permission to delete users' },
        { status: 403 }
      );
    }

    // Get target user's current role
    const targetUserQuery = 'SELECT role, email FROM users WHERE id = $1';
    const targetUserResult = await db.query(targetUserQuery, [targetUserId]);
    
    if (targetUserResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const targetUser = targetUserResult.rows[0];

    // Prevent self-deletion
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 403 }
      );
    }

    // Check if current user can manage the target user (role hierarchy)
    if (!canManageUser(currentUser.role, targetUser.role)) {
      return NextResponse.json(
        { message: 'You cannot delete users with equal or higher roles' },
        { status: 403 }
      );
    }

    // Delete the user
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    await db.query(deleteQuery, [targetUserId]);

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { message: 'Could not delete user', error: error.message },
      { status: 500 }
    );
  }
}