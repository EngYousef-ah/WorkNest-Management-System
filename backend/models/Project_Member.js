const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const projectMemberSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Member'],
        default: 'Member'
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

projectMemberSchema.index(
    { project_id: 1, user_id: 1 },
    {
        unique: true,
        partialFilterExpression: { deleted_at: null }
    }
);

projectMemberSchema.pre(/^find/, function (next) {
    this.where({ deleted_at: null });
});

const project_Member = mongoose.model('project_Member', projectMemberSchema);
module.exports = project_Member;