const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

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

// POST /api/requirements - Create a new requirement
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            type,
            category,
            title,
            city,
            area,
            ground,
            details,
            metaData
        } = req.body;

        const requirement = await prisma.requirement.create({
            data: {
                userId,
                type,
                category,
                title,
                city,
                area,
                ground,
                details,
                metaData: metaData || {},
            }
        });

        res.status(201).json({ success: true, requirement });
    } catch (error) {
        console.error('Create requirement error:', error);
        res.status(500).json({ success: false, error: 'Failed to create requirement' });
    }
});

// GET /api/requirements - Fetch requirements with filters
router.get('/', async (req, res) => {
    try {
        const { city, category, type } = req.query;

        const where = {
            status: 'OPEN'
        };

        if (city) where.city = city;
        if (category) where.category = category;
        if (type) where.type = type;

        const requirements = await prisma.requirement.findMany({
            where,
            include: {
                user: {
                    select: {
                        username: true,
                        playerprofile: {
                            select: {
                                avatarUrl: true,
                                fullName: true,
                                bowlingStyle: true,
                                battingStyle: true,
                                playingRole: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ success: true, requirements });
    } catch (error) {
        console.error('Fetch requirements error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requirements' });
    }
});

// GET /api/requirements/:id - Get a specific requirement
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requirement = await prisma.requirement.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        playerprofile: true
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ success: false, error: 'Requirement not found' });
        }

        res.json({ success: true, requirement });
    } catch (error) {
        console.error('Get requirement error:', error);
        res.status(500).json({ success: false, error: 'Failed to get requirement' });
    }
});

module.exports = router;
