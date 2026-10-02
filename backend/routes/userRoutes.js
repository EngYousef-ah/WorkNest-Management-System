const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth");
const multer = require('multer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});
const { supabase } = require("../config/supabase");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const validate = require("../middleware/validate");
const {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    updateProfileSchema
} = require("../validators/userValidators");

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get User By Email
router.get('/users/email/:email', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.params.email,
            email_verified: true
        }).select('-password_hash');

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Get User By Id
router.get('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash');
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Register A New User
router.post('/users/register', validate(registerSchema), async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = new User({
            full_name,
            email,
            password_hash,
            display_name: full_name,
            email_verified: false
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password_hash;


        const verificationToken = jwt.sign(
            { email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const verificationLink = `http://localhost:3000/users/verify/${verificationToken}`;

        res.status(201).json({
            message: "User created successfully. Verification email sent.",
            user: userResponse
        });

        transporter.sendMail({
            from: process.env.EMAIL,
            to: newUser.email,
            subject: "Verify Your Email",
            html: `
            <h2>Welcome ${escapeHtml(newUser.full_name)}</h2>
            <p>Click the link below to verify your account (Valid for 1 hour):</p>
            <a href="${verificationLink}">Verify Account</a>
        `
        })
            .then(() => console.log(`Verification email sent to ${newUser.email}`))
            .catch(err => console.error("Background Email sending failed:", err));

    } catch (err) {
        console.error("Error occurred:", err);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Verify User Email
router.get('/users/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.redirect('http://localhost:5173/verify-email?status=not_found');
        }

        if (user.email_verified) {
            return res.redirect('http://localhost:5173/verify-email?status=already_verified');
        }

        user.email_verified = true;
        await user.save();

        return res.redirect('http://localhost:5173/verify-email?status=success');
    } catch (error) {
        return res.redirect('http://localhost:5173/verify-email?status=invalid');
    }
});

// Login An Old User
router.post('/users/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password_hash');

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.email_verified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        user.last_active_at = new Date();
        await user.save();



        res.status(201).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                display_name: user.display_name
            }
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Change Password User
router.patch('/users/:id/change-password', auth, validate(changePasswordSchema), async (req, res) => {
    try {

        const { oldPassword, newPassword } = req.body;

        if (req.user.userId !== req.params.id) {
            return res.status(403).json({ message: "You can only change your own password." });
        }

        const user = await User.findById(req.params.id).select('+password_hash');
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        const new_password_hash = await bcrypt.hash(newPassword, 10);

        user.password_hash = new_password_hash;
        user.updated_at = Date.now();
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


router.patch('/users/:id/profile', auth, upload.single('avatar'), validate(updateProfileSchema), async (req, res) => {
    try {

        if (req.user.userId !== req.params.id) {
            return res.status(403).json({ message: "You can only update your own profile." });
        }

        const { displayName, timeZone } = req.body;
        const updateData = {};


        if (displayName !== undefined) updateData.display_name = displayName;
        if (timeZone !== undefined) updateData.timezone = timeZone;

        if (req.file) {
            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                return res.status(500).json({ error: "Failed to upload image to Supabase: " + uploadError.message });
            }

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            updateData.avatar_url = publicUrlData.publicUrl;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!updatedUser) {
            return res.status(400).json({ message: "User not found" });
        }

        if (Object.keys(updateData).length > 0) {
            updatedUser.updated_at = Date.now();
            await updatedUser.save();
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

module.exports = router;