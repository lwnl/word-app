const sqlite3 = require('sqlite3').verbose();

// connect to the database
const db = new sqlite3.Database('words.db');

// query for duplicate words
db.all(`
    SELECT word, COUNT(*) AS count
    FROM words
    GROUP BY word
    HAVING count > 1;
`, (err, rows) => {
    if (err) {
        console.error('Error querying database:', err.message);
        return;
    }

    // output duplicate words
    console.log('Duplicate words found:');
    console.table(rows);

    // delete duplicate words
    db.run(`
        DELETE FROM words
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM words
            GROUP BY word
        );
    `, function (err) {
        if (err) {
            console.error('Error deleting duplicate words:', err.message);
            return;
        }
        console.log(`Deleted ${this.changes} duplicate word(s).`);

        // close the database connection
        db.close();
    });
});
