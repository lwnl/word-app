import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config(); 

const SECRET_KEY = process.env.SECRET_KEY;

// Redirect to login if the user is not authenticated
function checkAuthAndRedirect(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, SECRET_KEY, (err) => {
      if (err) {
        return res.redirect('/login.html');
      }
      return res.redirect('/index.html');
    });
  } else {
    return res.redirect('/login.html');
  }
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  // Extract token from cookie
  const token = req.cookies.token;

  // If there is no token or the token is invalid, return 401
  if (!token) {
    return res.status(401).json({ error: 'No valid token' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'No valid token' }); // ✅ Return 401 and "No valid token" for all cases
    }
    req.user = user; // If verification succeeds, attach user information to the request object
    next(); // Proceed to the next middleware
  });
}

export { checkAuthAndRedirect, authenticateToken };