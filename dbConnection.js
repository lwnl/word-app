import mongoose from 'mongoose'

const dbURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/word-db'

export const dbConnection = async () => {
  try{
    await mongoose.connect(dbURL)
    console.log('DB connected')
  } catch(error) {
    console.error('Error connecting DB:', error.message)
    process.exit(1)
  }
}