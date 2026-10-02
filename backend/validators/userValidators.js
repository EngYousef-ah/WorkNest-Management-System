// validators/userValidators.js
const { z } = require('zod');

// 1. Register Schema
const registerSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, "Full name is required and must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

// 2. Login Schema
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

// 3. Change Password Schema
const changePasswordSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  }),
});

// 4. Update Profile Schema
const updateProfileSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    displayName: z.string().min(2).optional(),
    timeZone: z.string().optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
};