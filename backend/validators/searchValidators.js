const { z } = require('zod');

const searchSchema = z.object({
    params: z.object({
        slug: z.string().min(1, "Slug is required"),
    }),
    query: z.object({
        query: z.string({
            required_error: "query parameter is required",
        })
        .min(1, "query parameter cannot be empty")
        .max(50, "Search query is too long (maximum 50 characters)")
        .trim(),
        
        pageCard: z.coerce.number().int().positive().default(1),
        pageComment: z.coerce.number().int().positive().default(1),
    }),
});

module.exports = searchSchema;