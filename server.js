const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 引入 cookie-parser
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

let db;
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 443;
const SECRET_KEY = process.env.SECRET_KEY; // Read secret key from environment variables

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(cookieParser()); // 解析 cookie

// MongoDB connection configuration
const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    // strict: true,
    deprecationErrors: true,
  }
});
const dbName = "word-db";

// http version
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on http://wordapp.liangw.de:${PORT} or http://localhost:${PORT}`);
// });

run().catch(console.dir);

// https version
const httpsOptions = {
  key: fs.readFileSync('./cert/privkey.pem'),
  cert: fs.readFileSync('./cert/fullchain.pem')
};

// 创建 HTTPS 服务器
const httpsServer = https.createServer(httpsOptions, app);

// 启动 HTTPS 服务器
httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server is running on https://wordapp.liangw.de:${PORT} or https://localhost:${PORT}`);
});

// search and update word properties
app.patch('/api/words/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const updatedFields = req.body;
  console.log('Updating word:', { id, updatedFields }); // 添加调试日志

  try {
    const db = await connectToMongoDB();
    const collection = db.collection('words');
    const result = await collection.updateOne(
      { _id: new ObjectId(id), username: req.user.username },
      { $set: { categoryAdd: updatedFields.categoryAdd } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send('Word not found');
    } else {
      const updatedWord = await collection.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updatedWord);
    }
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});



// Function to connect to MongoDB
async function connectToMongoDB() {
  if (!db) {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB!");
      db = client.db(dbName); // 只需要设置一次数据库实例
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }
  // Check SSL certificate expiration date
  exec("openssl x509 -enddate -noout -in ./cert/fullchain.pem", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error checking certificate: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    // Parse and log the expiration date
    const expirationDate = stdout.split('=')[1].trim();
    console.log(
      `SSL Certificate expiration date: ${expirationDate}
Please renew when it expires
sudo certbot certonly --manual --preferred-challenges=dns -d yourdomain.com`);
  });
  return db; // 返回数据库实例
}

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

// Delete a word
async function deleteWord(id) {
  const db = await connectToMongoDB();
  const collection = db.collection('words');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
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

async function run() {
  try {
    const db = await connectToMongoDB();

    // Redirect root URL to login.html 
    app.get('/', checkAuthAndRedirect);
    app.get('/index.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'static', 'index.html'));
    });

    // Serve static files from the 'static' directory
    app.use(express.static(path.join(__dirname, 'static')));

    // User model
    const User = db.collection('users');

    // Registration route
    app.post('/api/register', async (req, res) => {
      const { username, password } = req.body;

      // Validate username and password
      const usernamePattern = /^[a-zA-Z0-9_]{4,}$/;
      if (!usernamePattern.test(username)) {
        return res.status(400).json({ error: 'Username must be at least 4 characters long and consist of letters, numbers, and underscores' });
      }

      if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long' });
      }

      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        const newUser = { username, password: hashedPassword, token };
        await User.insertOne(newUser);
        // Set the token as a cookie
        res.cookie('token', token, {
          httpOnly: true,  // Prevent access by JavaScript
          secure: true,    // Ensure the cookie is sent over HTTPS only
          sameSite: 'Strict', // Prevent CSRF attacks
          maxAge: 3600000  // 1 hour validity
        });
        return res.status(201).json({ message: 'User registered successfully', token }); // Only send one response
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Login route
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a new token
        const token = jwt.sign(
          {
            username: user.username,
            jti: uuid.v4(), // each time new JWT ID
          },
          SECRET_KEY,
          { expiresIn: '1h' }
        );
        // Set the token as a cookie
        res.cookie('token', token, {
          httpOnly: true,  // Prevent access by JavaScript
          secure: true,     // Ensure the cookie is sent over HTTPS only
          sameSite: 'Strict', // 放松 CSRF 防御，允许跨站点请求（如在登录后跳转）
          maxAge: 3600000  // 1 hour validity
        });

        return res.status(200).json({ message: 'Login successful', token }); // Only send one response
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Logout route
    app.post('/api/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
      });
      res.status(200).json({ message: 'Logout successful' });
    });



    // Create text index
    await db.collection('words').createIndex({ matherLanguage: 'text', german: 'text' });

    // Add word route (protected)
    app.post('/api/words', authenticateToken, async (req, res) => {
      const { matherLanguage, german, categoryAdd } = req.body;
      try {
        const result = await db.collection('words').insertOne({
          matherLanguage,
          german,
          categoryAdd,
          username: req.user.username,
          review: false
        });
        res.status(201).json({ id: result.insertedId });
      } catch (error) {
        console.error('Error adding word:', error);
        res.status(500).json({ error: 'Failed to add word' });
      }
    });

    // Get all words route (protected)
    app.get('/api/words', authenticateToken, async (req, res) => {
      try {
        const words = await db.collection('words').find({ username: req.user.username }).toArray();
        res.json(words);
      } catch (error) {
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
      }
    });

    // Search words route (protected)
    app.get('/api/words/search', authenticateToken, async (req, res) => {
      const query = req.query.query;
      try {
        const words = await db.collection('words').find({ $text: { $search: query }, username: req.user.username }).toArray();
        res.json(words);
      } catch (error) {
        console.error('Error searching words:', error);
        res.status(500).json({ error: 'Failed to search words' });
      }
    });
    // PATCH 路由来更新单词的 review 属性
    // 更新 review 属性的路由
    app.patch('/api/words/:id/review', authenticateToken, async (req, res) => {
      const id = req.params.id;
      const { review } = req.body;

      console.log('Updating word review:', { id, review });

      if (typeof review !== 'boolean') {
        return res.status(400).json({ error: 'Invalid review value' });
      }

      try {
        const db = await connectToMongoDB();
        const collection = db.collection('words');

        const result = await collection.updateOne(
          { _id: new ObjectId(id), username: req.user.username },
          { $set: { review } }
        );

        if (result.matchedCount === 0) {
          res.status(404).json({ error: 'Word not found' });
        } else {
          const updatedWord = await collection.findOne({ _id: new ObjectId(id) });
          res.status(200).json(updatedWord);
        }
      } catch (error) {
        console.error('Error updating word review:', error);
        res.status(500).json({ error: 'Failed to update review' });
      }
    });

    // Delete word route (protected)
    app.delete('/api/words/:id', authenticateToken, async (req, res) => {
      const id = req.params.id;
      try {
        const result = await deleteWord(id); // Use deleteWord function
        if (result) {
          res.sendStatus(204); // Successful deletion, return 204 status code
        } else {
          res.status(404).json({ error: 'Word not found' });
        }
      } catch (error) {
        console.error('Error deleting word:', error);
        res.status(500).json({ error: 'Failed to delete word' });
      }
    });

  } catch (err) {
    console.error(err.stack);
  }
}