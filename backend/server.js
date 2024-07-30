const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY; // Read secret key from environment variables

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS

// MongoDB connection configuration
const uri = "mongodb://localhost:27017";
const dbName = "word-db";
const client = new MongoClient(uri);

async function connectToDb() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    return client.db(dbName);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

// Delete a word
async function deleteWord(id) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // If no token, return 401 status

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // If token is invalid, return 403 status
    req.user = user; // Attach decoded user information to the request object
    next(); // Proceed to the next middleware or route handler
  });
}

async function run() {
  try {
    const db = await connectToDb();

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
        res.status(201).json({ token });
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
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Create text index
    await db.collection('words').createIndex({ chinese: 'text', german: 'text' });

    // Add word route (protected)
    app.post('/api/words', authenticateToken, async (req, res) => {
      const { chinese, german, categoryAdd } = req.body;
      try {
        const result = await db.collection('words').insertOne({
          chinese,     
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

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});