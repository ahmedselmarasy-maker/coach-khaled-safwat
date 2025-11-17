const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(express.static('.'));

// Import and use Netlify function
const sendEmailHandler = require('./netlify/functions/send-email');

// Handle multipart/form-data properly - must be before route handler
app.use('/.netlify/functions/send-email', express.raw({ 
    type: 'multipart/form-data',
    limit: '10mb' 
}));

// Proxy endpoint for Netlify function
app.post('/.netlify/functions/send-email', async (req, res) => {
    try {
        // Create a mock Netlify event object
        const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: req.body,
            isBase64Encoded: false
        };

        // Convert buffer to string for busboy
        if (Buffer.isBuffer(req.body)) {
            event.body = req.body.toString('binary');
        } else {
            event.body = req.body;
        }

        // Ensure content-type header is set
        if (!event.headers['content-type'] && req.headers['content-type']) {
            event.headers['content-type'] = req.headers['content-type'];
        }

        try {
            const result = await sendEmailHandler.handler(event, {});
            
            res.status(result.statusCode);
            res.setHeader('Content-Type', 'application/json');
            res.json(JSON.parse(result.body));
        } catch (error) {
            console.error('Function error:', error);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 الخادم يعمل على: http://localhost:${PORT}`);
    console.log(`📧 تأكد من إعداد متغيرات البيئة في ملف .env\n`);
});

