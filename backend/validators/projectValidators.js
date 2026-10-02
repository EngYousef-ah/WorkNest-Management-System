const { z } = require('zod');

const createProjectSchema = z.object({
    params: z.object({
        slug: z.string().min(1, "Workspace slug is required"),
    }),
    body: z.object({
        name: z.string({
            required_error: "Project name is required",
        })
            .min(3, "Project name must be at least 3 characters long")
            .max(50, "Project name must not exceed 50 characters")
            .trim(),

        description: z.string({
            required_error: "Project description is required",
        })
            .min(5, "Description must be at least 5 characters long")
            .max(500, "Description must not exceed 500 characters")
            .trim(),
    }),

});


module.exports = createProjectSchema;
