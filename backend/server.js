const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // 引入 MongoDB 驱动
const path = require('path'); // 导入 path 模块
const app = express();
const PORT = 3000;
const deleteWord = require('./database');

// 连接 MongoDB
const uri = "mongodb://localhost:27017"; // 替换为你的 MongoDB 连接字符串
const dbName = "word-db";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);

    // Serve static files from the 'frontend' directory
    app.use(express.static(path.join(__dirname, 'frontend')));

    // 创建文本索引
    await db.collection('words').createIndex({ chinese: 'text', german: 'text' });

    // 添加单词的路由
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

    // 获取所有单词的路由
    app.get('/api/words', async (req, res) => {
      try {
        const words = await db.collection('words').find().toArray();
        res.json(words);
      } catch (error) {
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
      }
    });

    // 搜索单词的路由
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

    // 删除单词的路由
    app.delete('/api/words/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await deleteWord(id); // 使用 deleteWord 函数
        if (result) {
          res.sendStatus(204); // 成功删除，返回204状态码
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

// 中间件
app.use(express.json());
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});