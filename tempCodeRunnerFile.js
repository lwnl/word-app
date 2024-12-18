const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;
const deleteWord = require('./database');
require('dotenv').config(); // 加载环境变量
const SECRET_KEY = process.env.SECRET_KEY; // 从环境变量中读取密钥

// Middleware
app.use(express.json()); // 解析 JSON 格式的请求体
app.use(cors()); // 允许跨域请求

// MongoDB 连接配置
const uri = "mongodb://localhost:27017";
const dbName = "word-db";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);

    // Serve static files from the 'frontend' directory
    app.use(express.static(path.join(__dirname, 'static')));

    // JWT 身份验证中间件
    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token == null) return res.sendStatus(401); // 如果没有令牌，返回 401 状态

      jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // 如果令牌无效，返回 403 状态
        req.user = user; // 将解码后的用户信息附加到请求对象上
        next(); // 继续处理下一个中间件或路由处理程序
      });
    }

    // 用户模型
    const User = db.collection('users');

    // 注册路由
    app.post('/api/register', async (req, res) => {
      const { username, password } = req.body;

      // 验证用户名和密码
      const usernamePattern = /^[a-zA-Z0-9_]{4,}$/;
      if (!usernamePattern.test(username)) {
        return res.status(400).json({ error: 'Username must be at least 4 characters long and consist of letters, numbers, and underscores' });
      }

      if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long' });
      }

      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        const newUser = { username, password: hashedPassword, token };
        await User.insertOne(newUser);
        res.status(201).json({ token });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 登录路由
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 创建文本索引
    await db.collection('words').createIndex({ chinese: 'text', german: 'text' });

    // 添加单词路由（受保护）
    app.post('/api/words', authenticateToken, async (req, res) => {
      const { chinese, german, categoryAdd } = req.body;
      try {
        const result = await db.collection('words').insertOne({ chinese, german, categoryAdd, username: req.user.username });
        res.status(201).json({ id: result.insertedId });
      } catch (error) {
        console.error('Error adding word:', error);
        res.status(500).json({ error: 'Failed to add word' });
      }
    });

    // 获取所有单词路由（受保护）
    app.get('/api/words', authenticateToken, async (req, res) => {
      try {
        const words = await db.collection('words').find({ username: req.user.username }).toArray();
        res.json(words);
      } catch (error) {
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
      }
    });

    // 搜索单词路由（受保护）
    app.get('/api/words/search', authenticateToken, async (req, res) => {
      const query = req.query.query;
      try {
        const words = await db.collection('words').find({ $text: { $search: query }, username: req.user.username }).toArray();
        res.json(words);
      } catch (error) {
        console.error('Error searching words:', error);
        res.status(500).json({ error: 'Failed to search words' });
      }
    });

    // 删除单词路由（受保护）
    app.delete('/api/words/:id', authenticateToken, async (req, res) => {
      const id = req.params.id;
      try {
        const result = await deleteWord(id); // 使用 deleteWord 函数
        if (result) {
          res.sendStatus(204); // 成功删除，返回 204 状态码
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});