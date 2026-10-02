const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CommentSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    card_id: {
        type: String,
        ref: 'Card',
        required: true
    },
    authorId: {
        type: String,
        ref: 'User'
    },
    content: {
        type: String,
        required: true
    },
    parentId: {
        type: String,
        ref: 'Comment',
        default: null
    },
    mentions: [{ 
        type: String,
        ref: 'User'
    }],
    isEdited: {
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



const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;