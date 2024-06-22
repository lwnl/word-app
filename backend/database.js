const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// connect to the database
const db = new sqlite3.Database(path.resolve(__dirname, 'words.db'), (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
  }
});

// create tables in the database
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chinese TEXT NOT NULL,
          german TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating words table', err);
          reject(err);
          return;
        }
      });

      resolve();
    });
  });
}

// add a new word to the database
function addWord(chinese, german, category) {
  return new Promise((resolve, reject) => {
    if (!chinese || !german || !category) {
      reject(new Error('Missing required fields'));
      return;
    }

    db.run('INSERT INTO words (chinese, german) VALUES (?, ?)', [chinese, german], function (err) {
      if (err) {
        reject(err);
        return;
      }

      const wordId = this.lastID;

      let table;
      if (category === 'tech') {
        table = 'techWords';
      } else if (category === 'daily') {
        table = 'dailyWords';
      } else {
        reject(new Error('Invalid category'));
        return;
      }

      db.run(`INSERT INTO ${table} (word_id) VALUES (?)`, [wordId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: wordId });
      });
    });
  });
}

// get all words from the database
function getAllWords() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM words', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Search words by Chinese or German
function searchWords(query) {
  return new Promise((resolve, reject) => {
    const searchQuery = `%${query}%`;
    db.all(
      'SELECT * FROM words WHERE chinese LIKE ? OR german LIKE ?',
      [searchQuery, searchQuery],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      }
    );
  });
}

// Delete a word by ID
function deleteWord(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM words WHERE id = ?', [id], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// export functions
module.exports = {
  addWord,
  getAllWords,
  createTables,
  searchWords,
  deleteWord
};
