const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST: Save Onboarding Data
router.post('/onboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, city, gender, avatarUrl } = req.body;

        if (!fullName || !city || !gender) {
            return res.status(400).json({ success: false, message: 'Missing required onboarding fields' });
        }

        // Create or Update player profile
        const profile = await prisma.playerProfile.upsert({
            where: { userId },
            update: {
                fullName,
                city,
                gender,
                avatarUrl
            },
            create: {
                userId,
                fullName,
                city,
                gender,
                avatarUrl
            }
        });

        // Mark user as onboarded
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { onboarded: true }
        });

        // Re-issue a new JWT with the updated onboarded status
        const token = jwt.sign(
            { id: updatedUser.id, role: updatedUser.role, onboarded: updatedUser.onboarded },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            profile,
            user: updatedUser
        });

    } catch (error) {
        console.error('Onboard Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
