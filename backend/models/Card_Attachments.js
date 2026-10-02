const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardAttachmentSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    cardId: {
        type: String,
        ref: 'Card',
        required: true
    },
    uploaderId: {
        type: String,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    storagePath: {
        type: String,
        required: true 
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,  
        required: true
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




const Card_Attachments = mongoose.model('Card_Attachments', CardAttachmentSchema);
module.exports = Card_Attachments;