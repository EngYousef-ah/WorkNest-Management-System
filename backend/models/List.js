const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ListSchema = new mongoose.Schema({

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
    board_id: {
        type: String,
        ref: 'Board',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    position: {
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



ListSchema.pre(/^find/, function (next) {
    this.where({ deleted_at: null });
});

const List = mongoose.model('List', ListSchema);
module.exports = List;