const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const DirectMessagesSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true,
        index: true
    },
    sender: {
        type: String,
        ref: 'User',
        required: true
    }
    ,
    receiver: {
        type: String,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
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

DirectMessagesSchema.index({ workspace_id: 1, sender: 1, receiver: 1, created_at: -1 });

const Direct_Messages = mongoose.model('Direct_Messages', DirectMessagesSchema);
module.exports = Direct_Messages;