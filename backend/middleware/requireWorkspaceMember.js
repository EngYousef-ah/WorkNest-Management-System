const Workspace = require('../models/Workspace');
const Workspace_Member = require('../models/Workspace_Members');

const requireWorkspaceMember = async (req, res, next) => {
    try {
        const workspaceSlug = req.params.slug;
        const userId = req.user.userId;

        if (!workspaceSlug) {
            return res.status(400).json({ error: 'Workspace Slug is required' });
        }

        const workspace = await Workspace.findOne({ slug: workspaceSlug })
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        const workspaceMember = await Workspace_Member.findOne({
            user_id: userId,
            workspace_id: workspace._id
        });

        if (!workspaceMember) {
            return res.status(403).json({ error: 'You are not authorized to access this workspace' });
        }


        req.workspace = workspace;
        req.workspaceMember = workspaceMember;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error while checking permissions' });
    }
};

module.exports = requireWorkspaceMember;