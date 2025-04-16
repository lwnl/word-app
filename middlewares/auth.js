import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config(); 

const SECRET_KEY = process.env.SECRET_KEY;

// Redirect to login if the user is not authenticated
function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.redirect('/login.html')

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.redirect('/login.html')

    req.user = decoded
    next()
  })
}

export { authenticateToken };