const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceLabelSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
    ,
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


workspaceLabelSchema.pre(/^find/, function () {
    this.where({ deleted_at: null });
});

const workspace_Label=mongoose.model('Workspace_Label',workspaceLabelSchema);
module.exports=workspace_Label;