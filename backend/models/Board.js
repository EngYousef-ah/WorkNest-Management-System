const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BoardSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    background: {
        type: String,
        required: true,
        trim: true
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



BoardSchema.pre(/^find/, function (next) {
    this.where({ deleted_at: null });
});

const Board = mongoose.model('Board', BoardSchema);
module.exports = Board;