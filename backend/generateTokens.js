const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // 引入 bcrypt
require('dotenv').config(); // 加载环境变量

const uri = "mongodb://localhost:27017"; // MongoDB 连接字符串
const dbName = "word-db";
const SECRET_KEY = process.env.SECRET_KEY; // 从环境变量中读取密钥

async function generateTokensAndUpdatePasswords() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);
    const User = db.collection('users');

    // 查找所有用户
    const users = await User.find().toArray();
    console.log(`Found ${users.length} users`);

    // 为每个用户生成新的令牌并更新密码
    for (const user of users) {
      // 生成新的令牌
      const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });

      // 如果密码是明文的，则加密密码
      if (user.password && !user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // 更新用户的令牌和加密后的密码
        await User.updateOne(
          { _id: user._id },
          { $set: { token, password: hashedPassword } }
        );
        console.log(`Updated token and password for user: ${user.username}`);
      } else {
        // 仅更新令牌
        await User.updateOne(
          { _id: user._id },
          { $set: { token } }
        );
        console.log(`Updated token for user: ${user.username}`);
      }
    }

    console.log('All tokens generated and passwords updated.');
  } catch (err) {
    console.error('Error generating tokens and updating passwords:', err);
  } finally {
    await client.close();
  }
}

generateTokensAndUpdatePasswords();