const { z } = require('zod');

const sendMessageSchema = z.object({
    body: z.object({
        slug: z.string().min(1, "Workspace slug is required"),
        content: z.string({
            required_error: "Message content cannot be empty.",
        })
        .min(1, "Message content cannot be empty.")
        .max(1000, "Message is too long (maximum 1000 characters).")
        .trim(),
    }),
});

module.exports = sendMessageSchema;