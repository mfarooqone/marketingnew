const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrImage = require('qr-image');

const app = express();
const client = new Client();

let qrCodeData;

client.on('qr', qr => {
    qrCodeData = qr;
});

client.on('authenticated', session => {
    console.log('Authenticated');
    console.log('Session: ', session);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('disconnected', () => {
    console.log('Client disconnected, trying to reconnect...');
    client.initialize();
});

client.on('auth_failure', msg => {
    console.error('Authentication failed:', msg);
});

client.initialize().catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
});

app.use(express.json());

app.get('/', (req, res) => {
    const qrImageBuffer = qrImage.imageSync(qrCodeData, { type: 'png' });
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(qrImageBuffer);
});

// app.post('/send-message', async (req, res) => {
//     try {
//         const { phoneNumbers, message } = req.body;
//         if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
//             throw new Error('Invalid request body');
//         }
//         for (const phoneNumber of phoneNumbers) {
//             const chatId = `${phoneNumber}@c.us`;
//             await client.sendMessage(chatId, message);
//             console.log(`Message sent successfully to ${phoneNumber}`);
//         }
//         res.status(200).send('Messages sent successfully!');
//     } catch (error) {
//         console.error('Error sending message:', error);
//         res.status(500).send('Error sending message');
//     }
// });

app.post('/send-message', async (req, res) => {
    try {
        const { phoneNumbers, message } = req.body;
        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
            throw new Error('Invalid request body');
        }

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            const chatId = `${phoneNumber}@c.us`;

            // Delay sending the message by 5 seconds for each iteration
            setTimeout(async () => {
                try {
                    await client.sendMessage(chatId, message);
                    console.log(`Message sent successfully to ${phoneNumber}`);
                } catch (error) {
                    console.error(`Error sending message to ${phoneNumber}:`, error);
                }

                // If it's the last message, send the response
                if (i === phoneNumbers.length - 1) {
                    res.status(200).send('Messages sent successfully!');
                }
            }, i * 5000); // 5000 milliseconds = 5 seconds
        }
    } catch (error) {
        console.error('Error sending messages:', error);
        res.status(500).send('Error sending messages');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});