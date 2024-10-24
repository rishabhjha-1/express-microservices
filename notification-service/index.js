const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

app.post('/send-email', (req, res) => {
    const { to, subject, text } = req.body;
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });
    
    const mailOptions = {
        from: process.env.email,
        to: to,
        subject: subject,
        text: text
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent: ' + info.response);
    });
});

app.listen(3002, () => console.log('Notification Service is running on port 3002'));
