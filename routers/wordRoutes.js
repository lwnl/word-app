import express from 'express';
import Word from '../models/Word.js';  
import { authenticateToken } from '../middlewares/auth.js';  // 引入身份验证中间件

const wordRouter = express.Router();

// Add a word
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

// Get all words
wordRouter.get('/api/words', async (req, res) => {
  try {
    const words = await Word.find();
    res.status(200).json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Update word categoryAdd field (PATCH)
wordRouter.patch('/api/words/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const updatedFields = req.body;
  console.log('Updating word:', { id, updatedFields });  // Add debug log

  try {
    const result = await Word.updateOne(
      { _id: id, username: req.user.username },
      { $set: { categoryAdd: updatedFields.categoryAdd } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send('Word not found');
    } else {
      const updatedWord = await Word.findById(id);
      res.status(200).json(updatedWord);
    }
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// Delete a word (DELETE)
wordRouter.delete('/api/words/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await Word.deleteOne({ _id: id, username: req.user.username });

    if (result.deletedCount === 0) {
      return res.status(404).send('Word not found');
    } else {
      res.status(204).send();  // Successfully deleted
    }
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

export default wordRouter;