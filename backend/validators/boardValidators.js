const { z } = require('zod');

const createBoardSchema = z.object({
    params: z.object({
        slug: z.string().min(1, "Workspace slug is required"),
        projectId: z.string().uuid("Invalid project ID format"),
    }),
    body: z.object({
        name: z.string({
            required_error: "Board name is required",
        })
            .min(2, "Board name must be at least 2 characters long")
            .max(50, "Board name must not exceed 50 characters")
            .trim(),

        background: z.string({
            required_error: "Board background is required",
        })
            .min(1, "Board background cannot be empty")
            .trim(),
    }),
});

module.exports = createBoardSchema;