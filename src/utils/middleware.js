const { verifyToken } = require('./auth');

// Middleware to verify JWT token
const authenticateToken = (handler) => {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return new Response(
          JSON.stringify({ message: 'Access token required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const decoded = verifyToken(token);
      
      // Add user info to request context
      request.user = decoded;
      
      return handler(request, context);
    } catch (error) {
      return new Response(
        JSON.stringify({ message: 'Invalid token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
};

module.exports = { authenticateToken };