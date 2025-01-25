import express from 'express';
import Word from './models/Word.js';  // 引入 Word 模型

const wordRouter = express.Router();

// add a word
wordRouter.post('/api/words', async (req, res) => {
  const { matherLanguage, german, categoryAdd, username, review } = req.body;

  try {
    const newWord = new Word({
      matherLanguage,
      german,
      categoryAdd,
      username,
      review,
    });

    await newWord.save();

    res.status(201).json({ message: 'Word added successfully', word: newWord });
  } catch (error) {
    console.error('Error adding word:', error);
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// get all words
wordRouter.get('/api/words', async (req, res) => {
  try {
    const words = await Word.find();
    res.status(200).json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

export default wordRouter;