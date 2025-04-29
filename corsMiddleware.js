// Custom CORS middleware to handle various deployment environments
const corsMiddleware = (req, res, next) => {
    // List of allowed origins
    const allowedOrigins = [
      'https://econsciente-app.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173',
      // Add more origins as needed
    ];
  
    // Get the origin from the request headers
    const origin = req.headers.origin;
    
    // Check if the origin is in our list of allowed origins
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // For development/testing - accept any origin
      // Comment this out in production if you want strict origin checking
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  
    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
  
  module.exports = corsMiddleware;