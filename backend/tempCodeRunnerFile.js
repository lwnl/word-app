const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // 引入 MongoDB 驱动
const app = express();
const PORT = 3000;

// 连接 MongoDB
const uri = "mongodb://localhost:27017"; // 替换为你的 MongoDB 连接字符串
const dbName = "word-db";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);

    // ... 其他路由处理函数

  } catch (err) {
    console.error(err.stack);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

// 中间件
app.use(express.json());
app.use(cors());

// 路由处理函数
// ... (与之前类似，但调用数据库操作函数时使用新的 MongoDB 函数)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
