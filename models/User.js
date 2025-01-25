import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 4,
  },

  password: {
    type: String,
    required: true,
    minlength: 4,
  }
})

const User = mongoose.model('User', userSchema) 
export default User