const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
 
  _id: {
    type: String,
    default: uuidv4 
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, 
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true,
    select: false
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  display_name: {
    type: String,
    trim: true
  },
  avatar_url: {
    type: String,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  last_active_at: {
    type: Date,
    default: Date.now
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

userSchema.pre(/^find/, function(next) {
  this.where({ deleted_at: null });
});

const User = mongoose.model('User', userSchema);
module.exports = User;