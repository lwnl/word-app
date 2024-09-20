const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string
const dbName = "word-db";
const client = new MongoClient(uri);

async function clearDatabaseAndIndexes() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.collections();

    // Iterate over all collections
    for (const collection of collections) {
      // Delete all documents in the collection
      const deleteResult = await collection.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} documents from collection ${collection.collectionName}`);
      
      // Drop all indexes in the collection (except the _id index)
      const indexes = await collection.indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') { // Do not drop the default _id index
          await collection.dropIndex(index.name);
          console.log(`Dropped index ${index.name} from collection ${collection.collectionName}`);
        }
      }
    }

    console.log("Database cleared and indexes removed successfully.");
  } catch (error) {
    console.error("Error clearing database and indexes:", error);
  } finally {
    // Close MongoDB connection
    await client.close();
  }
}

clearDatabaseAndIndexes().catch(console.error);