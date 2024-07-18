const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017"; // 替换为你的 MongoDB 连接字符串
const dbName = "word-db";
const client = new MongoClient(uri);

async function clearDatabase() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.collections();

    for (const collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from collection ${collection.collectionName}`);
    }

    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await client.close();
  }
}

clearDatabase().catch(console.error);