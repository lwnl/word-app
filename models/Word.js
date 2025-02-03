import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema({
  motherLanguage: {
    type: String,
    required: true,
  },
  german: {
    type: String,
    required: true,
  },
  categoryAdd: {
    type: String,
    required: true,
  },
  review: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    required: true,
  },
})

const Word = mongoose.model('Word', wordSchema)
export default Word
