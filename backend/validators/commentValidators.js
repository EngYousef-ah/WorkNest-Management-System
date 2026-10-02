const { z } = require('zod');

const createCommentSchema = z.object({
    body: z.object({
        content: z.string({
            required_error: "Content is required.",
        })
            .min(1, "Content cannot be empty.")
            .max(1000, "Comment is too long (maximum 1000 characters).")
            .trim(),

        parentId: z.string().uuid("Invalid parent comment ID ").optional().nullable(),

    }),
});

module.exports = createCommentSchema;