const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;
const db = require('./database.js'); // Import functions from database.js

// 
app.use(express.json());
app.use(cors());

// Create tables on application startup
db.createTables()
  .catch((err) => {
    console.error('Error creating tables:', err.message);
    process.exit(1); // Exit process if table creation fails
  });

// Add new word (call function from database.js)
app.post('/api/words', async (req, res) => {
  try {
    const { chinese, german, category } = req.body;
    const word = await db.addWord(chinese, german, category);
    res.json(word);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
}); 

// Get all words (call function from database.js)
app.get('/api/words', async (req, res) => {
  try {
    const words = await db.getAllWords();
    res.json(words);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Search words by Chinese or German 
app.get('/api/words/search', async (req, res) => {
  try {
    const query = req.query.query;
    const words = await db.searchWords(query);
    res.json(words);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a word by ID
app.delete('/api/words/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.deleteWord(id);
    res.status(204).end(); // Successfully deleted, no content to return
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
