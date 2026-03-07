const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

// Configure Multer to temporarily store the file in memory before uploading to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Upload Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.error('Missing Cloudinary Config. Check your .env file!');
            return res.status(500).json({ error: 'Cloud storage is currently misconfigured.' });
        }

        // Convert the file buffer to a base64 string to upload directly from memory
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        // Upload to Cloudinary avatars folder
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'wickets_ai/avatars',
            resource_type: 'auto',
        });

        // Return the secure, permanent public URL!
        res.status(200).json({ url: result.secure_url });

    } catch (error) {
        console.error('Cloudinary Upload failed:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// 3. Delete Endpoint
router.post('/delete', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        // Extract public ID from Cloudinary URL
        // Example URL: https://res.cloudinary.com/xxxx/image/upload/v12345/wickets_ai/avatars/avatar_123.jpg
        const splitUrl = url.split('/');
        const filename = splitUrl.pop(); // avatar_123.jpg
        const folderPath = splitUrl.slice(splitUrl.indexOf('wickets_ai')).join('/'); // wickets_ai/avatars
        const publicId = `${folderPath}/${filename.split('.')[0]}`; // wickets_ai/avatars/avatar_123

        const result = await cloudinary.uploader.destroy(publicId);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Cloudinary Delete failed:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

module.exports = router;
