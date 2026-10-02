const { z } = require('zod');


const createCardSchema = z.object({
    params: z.object({
        slug: z.string().min(1, "Workspace slug is required"),
        projectId: z.string().uuid("Invalid project ID format"),
        boardId: z.string().uuid("Invalid board ID format"),
        listId: z.string().uuid("Invalid list ID format"),  
    }),
    body: z.object({
        title: z.string({ required_error: "Card title is required" })
            .min(1, "Card title cannot be empty")
            .trim(),
        description: z.string({ required_error: "Card description is required" })
            .min(1, "Card description cannot be empty")
            .trim(),
        priority: z.string({ required_error: "Card priority is required" })
            .min(1, "Card priority is required"),
        dueDate: z.string({ required_error: "Card due date is required" })
            .min(1, "Card due date is required"),
    }),
});

const updateCardSchema = z.object({
    params: z.object({
      slug: z.string().min(1, "Workspace slug is required"),
        projectId: z.string().uuid("Invalid project ID format"),
        boardId: z.string().uuid("Invalid board ID format"),
        listId: z.string().uuid("Invalid list ID format"),  
    }),
    body: z.object({
        title: z.string().min(1, "Title cannot be empty").trim().optional(),
        description: z.string().min(1, "Description cannot be empty").trim().optional(),
        priority: z.string().min(1, "Priority cannot be empty").optional(),
        due_date: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
    }),
});

module.exports = {
    createCardSchema,
    updateCardSchema,
};