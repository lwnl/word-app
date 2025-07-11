import express from 'express';
import cookieParser from 'cookie-parser';
import { dbConnection } from './dbConnection.js';
import wordsRoutes from './routers/wordRoutes.js';  
import userRoutes from './routers/userRoutes.js';
import path from 'path';  
import { fileURLToPath } from 'url';  


const app = express();
const PORT = process.env.PORT;

// DB connection
dbConnection()

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // 解析 cookie


//routers
app.use(wordsRoutes)
app.use(userRoutes)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'login.html'))
})

app.use(express.static(path.join(__dirname, 'static'))); 


// http version
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});