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

// GET: Check username availability
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Validation: 3-20 chars, alphanumeric or underscores
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.json({
                success: true,
                available: false,
                message: 'Username must be 3-20 characters long and can only contain letters, numbers, and underscores.'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
        });

        res.json({ success: true, available: !existingUser });
    } catch (error) {
        console.error('Check Username Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST: Save Onboarding Data
router.post('/onboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, city, gender, avatarUrl, username } = req.body;

        if (!fullName || !city || !gender || !username) {
            return res.status(400).json({ success: false, message: 'Missing required onboarding fields' });
        }

        // Check username uniqueness again for safety
        const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
        if (existingUsername && existingUsername.id !== userId) {
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        }

        // Create or Update player profile
        const profile = await prisma.playerprofile.upsert({
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

        // Mark user as onboarded and save username
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                onboarded: true,
                username: username.toLowerCase()
            }
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

// PUT: Update Profile Data
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, city, dateOfBirth, playingRole, battingStyle, bowlingStyle, gender, avatarUrl, email, username } = req.body;

        const updateData = {};

        // 1. Handle Username update
        if (username) {
            const lowUsername = username.toLowerCase();
            const existingUser = await prisma.user.findUnique({ where: { username: lowUsername } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ success: false, message: 'Username is already taken' });
            }
            updateData.username = lowUsername;
        }

        // 2. Handle Email update
        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ success: false, message: 'Email is already in use' });
            }
            updateData.email = email;
        }

        // Apply User updates if any
        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }

        // 1. Parse DOB specifically for DateTime format if provided
        let parsedDob = undefined;
        if (dateOfBirth) {
            const dateObj = new Date(dateOfBirth);
            if (!isNaN(dateObj)) {
                parsedDob = dateObj;
            }
        }

        // 2. Upsert the Player Profile
        const updatedProfile = await prisma.playerprofile.upsert({
            where: { userId },
            update: {
                fullName: fullName !== undefined ? fullName : undefined,
                city: city !== undefined ? city : undefined,
                gender: gender !== undefined ? gender : undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
                playingRole: playingRole !== undefined ? playingRole : undefined,
                battingStyle: battingStyle !== undefined ? battingStyle : undefined,
                bowlingStyle: bowlingStyle !== undefined ? bowlingStyle : undefined,
                dateOfBirth: parsedDob
            },
            create: {
                userId,
                fullName: fullName || 'Unknown',
                city: city || 'Unknown',
                gender: gender || 'Prefer not to say',
                avatarUrl: avatarUrl || null,
                playingRole: playingRole || null,
                battingStyle: battingStyle || null,
                bowlingStyle: bowlingStyle || null,
                dateOfBirth: parsedDob
            }
        });

        // Refetch User just in case client expects full user payload
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        res.json({
            success: true,
            user: updatedUser,
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        require('fs').writeFileSync('debug.log', String(error.stack || error));
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST: Check if email belongs to another account
router.post('/check-email', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { playerprofile: true }
        });

        if (existingUser && existingUser.id !== req.user.id) {
            return res.json({
                success: true,
                exists: true,
                existingProfile: {
                    fullName: existingUser.playerprofile?.fullName || 'Unknown Player',
                    city: existingUser.playerprofile?.city || 'Unknown Location'
                }
            });
        }
        res.json({ success: true, exists: false });
    } catch (error) {
        console.error('Check Email Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST: Merge current account into existing email account
router.post('/merge', authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { targetEmail, keepProfile } = req.body; // keepProfile: 'current' | 'existing'

        // 1. Get both users
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { playerprofile: true }
        });
        const existingUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { playerprofile: true }
        });

        if (!existingUser || existingUser.id === currentUserId) {
            return res.status(400).json({ success: false, message: 'Invalid target email for merge.' });
        }

        // 2. Transfer mobile auth identifiers to the target account
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                phone: currentUser.phone || existingUser.phone,
                firebaseUid: currentUser.firebaseUid || existingUser.firebaseUid
            }
        });

        // 3. Resolve profile conflict
        if (keepProfile === 'current' && currentUser.playerprofile) {
            // Overwrite existing profile with current one
            const cp = currentUser.playerprofile;
            await prisma.playerprofile.upsert({
                where: { userId: existingUser.id },
                update: {
                    fullName: cp.fullName,
                    city: cp.city,
                    dateOfBirth: cp.dateOfBirth,
                    playingRole: cp.playingRole,
                    battingStyle: cp.battingStyle,
                    bowlingStyle: cp.bowlingStyle,
                    gender: cp.gender,
                    avatarUrl: cp.avatarUrl
                },
                create: {
                    userId: existingUser.id,
                    fullName: cp.fullName,
                    city: cp.city,
                    dateOfBirth: cp.dateOfBirth,
                    playingRole: cp.playingRole,
                    battingStyle: cp.battingStyle,
                    bowlingStyle: cp.bowlingStyle,
                    gender: cp.gender,
                    avatarUrl: cp.avatarUrl
                }
            });
        }

        // 4. Delete current obsolete account
        await prisma.user.delete({
            where: { id: currentUserId }
        });

        // 5. Fetch fully merged user payload
        const finalMergedUser = await prisma.user.findUnique({
            where: { id: existingUser.id },
            include: { playerprofile: true }
        });

        // 6. Generate fresh session JWT for merged account
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: finalMergedUser.id, role: finalMergedUser.role, onboarded: finalMergedUser.onboarded },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: finalMergedUser.id,
                role: finalMergedUser.role,
                onboarded: finalMergedUser.onboarded,
                phone: finalMergedUser.phone,
                email: finalMergedUser.email,
                createdAt: finalMergedUser.createdAt
            },
            profile: finalMergedUser.playerprofile
        });

    } catch (error) {
        console.error('Merge Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during merge' });
    }
});

module.exports = router;
