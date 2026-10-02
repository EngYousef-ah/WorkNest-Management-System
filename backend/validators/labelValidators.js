const { z } = require('zod');



// 2. Create Label Schema (body + slug)
const createLabelSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Workspace slug is required"),
  }),
  body: z.object({
    name: z.string({
      required_error: "Label name is required",
      invalid_type_error: "Label name must be a string"
    })
    .trim()
    .min(1, "Label name cannot be empty")
    .min(2, "Label name must be at least 2 characters long"),
    
    color: z.string({
      required_error: "Label color is required",
      invalid_type_error: "Label color must be a string"
    })
    .trim()
    .min(1, "Label color is required"),
  }),
});



module.exports = {
  createLabelSchema
};