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

  if (token == null) return res.redirect('/login.html'); // If no token, return 401 status

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // If token is invalid, return 403 status
    req.user = user; // Attach decoded user information to the request object
    next(); // Proceed to the next middleware or route handler
  });
}

export { checkAuthAndRedirect, authenticateToken };