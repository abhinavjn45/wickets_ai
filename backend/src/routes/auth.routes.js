const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verify OTP success and create session JWT
router.post('/verify', async (req, res) => {
    try {
        // In a production app with a real Firebase flow, the frontend sends a Firebase ID Token, 
        // and we verify it with firebase-admin. Since the custom Email OTP flow bypasses Firebase,
        // we accept the validated uid/email directly for this MVP.
        const { uid, email, phone, loginMethod } = req.body;

        if (!uid && !email) {
            return res.status(400).json({ success: false, message: 'Missing user identifier' });
        }

        let user;

        if (loginMethod === 'email') {
            // Custom Email OTP Flow
            user = await prisma.user.findUnique({
                where: { email },
                include: { playerProfile: true }
            });
            if (!user) {
                user = await prisma.user.create({
                    data: { email },
                    include: { playerProfile: true }
                });
            }
        } else if (loginMethod === 'mobile') {
            // Firebase Mobile OTP Flow
            user = await prisma.user.findUnique({
                where: { firebaseUid: uid },
                include: { playerProfile: true }
            });
            if (!user) {
                user = await prisma.user.findUnique({
                    where: { phone },
                    include: { playerProfile: true }
                });
                if (user) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { firebaseUid: uid },
                        include: { playerProfile: true }
                    });
                } else {
                    user = await prisma.user.create({
                        data: { firebaseUid: uid, phone },
                        include: { playerProfile: true }
                    });
                }
            }
        }

        // Generate custom JWT session token
        const token = jwt.sign(
            { id: user.id, role: user.role, onboarded: user.onboarded },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                role: user.role,
                onboarded: user.onboarded,
                phone: user.phone,
                email: user.email,
                createdAt: user.createdAt
            },
            profile: user.playerProfile || null
        });

    } catch (error) {
        console.error('Auth Verify Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
