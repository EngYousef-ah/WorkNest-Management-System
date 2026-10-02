const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const projectSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    }
    ,
    name: {
        type: String,
        default: null,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    }
    ,
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
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

projectSchema.pre(/^find/, function (next) {
    this.where({ deleted_at: null });
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;