const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Import MongoDB driver
const path = require('path'); // Import path module
const app = express();
const PORT = 3000;
const deleteWord = require('./database');

// Connect to MongoDB
const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string
const dbName = "word-db";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);

    // Serve static files from the 'frontend' directory
    app.use(express.static(path.join(__dirname, 'static')));

    // Route for registering new users
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
        // Check if username already exists
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists, please choose a different username' });
        }

        // Store user information
        await db.collection('users').insertOne({ username, password });
        res.status(201).json({ message: 'Registration successful' });
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    // Route for logging in users
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
    
      try {
        const user = await db.collection('users').findOne({ username });
        if (user && user.password === password) {
          res.status(200).json({ message: 'Login successful' });
        } else {
          res.status(400).json({ error: 'Invalid username or password' });
        }
      } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    // Create text index
    await db.collection('words').createIndex({ chinese: 'text', german: 'text' });

    // Route for adding a word
    app.post('/api/words', async (req, res) => {
      const { chinese, german, categoryAdd } = req.body;
      try {
        const result = await db.collection('words').insertOne({ chinese, german, categoryAdd });
        res.status(201).json({ id: result.insertedId });
      } catch (error) {
        console.error('Error adding word:', error);
        res.status(500).json({ error: 'Failed to add word' });
      }
    });

    // Route for fetching all words
    app.get('/api/words', async (req, res) => {
      try {
        const words = await db.collection('words').find().toArray();
        res.json(words);
      } catch (error) {
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
      }
    });

    // Route for searching words
    app.get('/api/words/search', async (req, res) => {
      const query = req.query.query;
      try {
        const words = await db.collection('words').find({ $text: { $search: query } }).toArray();
        res.json(words);
      } catch (error) {
        console.error('Error searching words:', error);
        res.status(500).json({ error: 'Failed to search words' });
      }
    });

    // Route for deleting a word
    app.delete('/api/words/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await deleteWord(id); // Use deleteWord function
        if (result) {
          res.sendStatus(204); // Successfully deleted, return 204 status code
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

// Middleware
app.use(express.json());
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});