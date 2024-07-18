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

// 添加新单词
async function addWord(chinese, german, categoryAdd) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const result = await collection.insertOne({ chinese, german, categoryAdd });
  return { id: result.insertedId.toString() }; // 返回插入的文档的 ID
}

// 获取所有单词
async function getAllWords() {
  const db = await connectToDb();
  const collection = db.collection('words');
  const words = await collection.find().toArray();
  return words;
}

// 搜索单词
async function searchWords(query) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const words = await collection.find({ $text: { $search: query } }).toArray();
  return words;
}

// 删除单词
async function deleteWord(id) {
  const db = await connectToDb();
  const collection = db.collection('words');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

module.exports = {
  addWord,
  getAllWords,
  searchWords,
  deleteWord
};
