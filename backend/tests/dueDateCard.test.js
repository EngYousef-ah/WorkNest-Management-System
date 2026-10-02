const request = require('supertest');
const app = require('../server');
const Activity_Log = require("../models/Activity_logs");
const Board = require("../models/Board");
const Card = require("../models/Card");
const List = require("../models/List");
const Project = require("../models/Project");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Workspace_Member = require('../models/Workspace_Members');



const generateToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
};
it('should update card due date and trigger the expected change activity log', async () => {
    const user = await User.create({
        full_name: 'Card Editor',
        email: `editor_${Date.now()}@example.com`,
        password_hash: 'hashedpassword'
    });
    const token = generateToken(user._id);

    const workspace = await Workspace.create({
        name: 'Test Workspace',
        slug: `test-slug-${Date.now()}`,
        owner_id: user._id
    });
    await Workspace_Member.create({
        workspace_id: workspace._id,
        user_id: user._id,
        role: "Owner",
        joined_at: new Date()
    });

    const project = await Project.create({
        name: 'Test Project',
        workspace_id: workspace._id,
        user_id: user._id
    });

    const board = await Board.create({
        name: 'Test Board',
        background: "#FFFFFF",
        workspace_id: workspace._id,
        project_id: project._id
    });

    const list = await List.create({
        name: 'Test List',
        position: 2,
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id
    });

    const card = await Card.create({
        title: 'Card with Due Date',
        description: 'Testing due date change',
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        list_id: list._id,
        position: 1,
        due_date: new Date('2026-06-01T00:00:00.000Z'),
        created_by: user._id
    });

    const newDueDate = '2026-07-01T00:00:00.000Z';
    const res = await request(app)
        .patch(`/workspaces/${workspace.slug}/projects/${project._id}/boards/${board._id}/lists/${list._id}/cards/${card._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            due_date: newDueDate
        });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Card updated successfully');

    const updatedCardDate = new Date(res.body.card.due_date).toISOString();
    expect(updatedCardDate).toEqual(new Date(newDueDate).toISOString());

    const activityLog = await Activity_Log.findOne({
        card_id: card._id
    }).sort({ createdAt: -1 });
    expect(activityLog).not.toBeNull();
    expect(activityLog.action).toContain('Change the due date');

}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
});