// validators/workspaceValidators.js
const { z } = require('zod');

// 1. Create Workspace Schema
const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters long"),
    description: z.string().optional(),
  }),
});

// 2. Update Workspace Schema
const updateWorkspaceSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Workspace slug is required"),
  }),
  body: z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters long").optional(),
    description: z.string().optional(),
  }),
});

// 3. Invite Member Schema
const inviteMemberSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Workspace slug is required"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(['Member', 'Admin'], {
      errorMap: () => ({ message: "Invalid role specified, must be either Member or Admin" })
    }).optional(),
  }),
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
};