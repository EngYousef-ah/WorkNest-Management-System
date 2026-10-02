const request = require('supertest');
const app = require('../server');

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
it('should not include archived cards in normal card lists', async () => {
    const user = await User.create({
        full_name: 'Archive Tester',
        email: `archive_${Date.now()}@example.com`,
        password_hash: 'hashedpassword'
    });
    const token = generateToken(user._id);

    const workspace = await Workspace.create({
        name: 'Test Workspace',
        slug: `test-slug-dueDate-${Date.now()}`,
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
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        position: 2,
    });

    const activeCard = await Card.create({
        title: 'Active Card',
        description: 'Should appear',
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        list_id: list._id,
        position: 1,
        created_by: user._id,
        deleted_at: null
    });

    const archivedCard = await Card.create({
        title: 'Archived Card',
        description: 'Should NOT appear',
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        list_id: list._id,
        position: 2,
        created_by: user._id,
        deleted_at: new Date()
    });

    const normalCardsList = await Card.find({
        list_id: list._id,
        deleted_at: null
    });

    expect(normalCardsList.length).toEqual(1);
    expect(normalCardsList[0]._id.toString()).toEqual(activeCard._id.toString());

    const res = await request(app)
        .delete(`/workspaces/${workspace.slug}/projects/${project._id}/boards/${board._id}/lists/${list._id}/cards/${activeCard._id}/archive`)
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Card archived successfully');

    const recheckedCard = await Card.findById(activeCard._id);
    expect(recheckedCard.deleted_at).not.toBeNull();

}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
});