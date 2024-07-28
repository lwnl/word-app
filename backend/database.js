const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb://localhost:27017";
const dbName = "word-db";
const client = new MongoClient(uri);

async function connectToDb() {
  try {
    await client.connect();
    return client.db(dbName);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

// add new word
async function addWord(chinese, german, categoryAdd) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const result = await collection.insertOne({ chinese, german, categoryAdd });
  return { id: result.insertedId.toString() }; // return the id of the newly added word
}

// aquiring all words
async function getAllWords() {
  const db = await connectToDb();
  const collection = db.collection('words');
  const words = await collection.find().toArray();
  return words;
}

// search a word
async function searchWords(query) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const words = await collection.find({ $text: { $search: query } }).toArray();
  return words;
}

// delete a word
async function deleteWord(id) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

module.exports = deleteWord