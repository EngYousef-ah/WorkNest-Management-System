const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required:true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  logo_url: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },

  owner_id: {
    type: String,
    ref: 'User',
    required: true
  },

  settings: {
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    allow_invites: {
      type: Boolean,
      default: true
    },
    default_role: {
      type: String,
      default: 'member'
    }
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

workspaceSchema.pre(/^find/, function () {
  this.where({ deleted_at: null });
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;