const { z } = require('zod');

const createListSchema = z.object({
    params: z.object({
      slug: z.string().min(1, "Workspace slug is required"),
        projectId: z.string().uuid("Invalid project ID format"),
        boardId: z.string().uuid("Invalid board ID format"),
    }),
    body: z.object({
        name: z.string({
            required_error: "List name is required",
        })
        .min(2, "List name must be at least 2 characters long")
        .max(50, "List name must not exceed 50 characters")
        .trim(),
    }),
});

module.exports = createListSchema;