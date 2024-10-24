const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch'); 
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// Correct MongoDB connection string
mongoose.connect('mongodb://localhost:27017/purchases', { useNewUrlParser: true, useUnifiedTopology: true });

const purchaseSchema = new mongoose.Schema({
    itemName: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    shippingCharges: Number,
    taxAmount: Number,
    superiorEmail: String,
    status: { type: String, default: 'Pending' },
    requesterEmail: String
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

// Create purchase request
app.post('/create-purchase', async (req, res) => {
    try {
        const purchase = new Purchase(req.body);
        await purchase.save();

        // Notify requester and superior
        const notificationServiceUrl = 'http://localhost:3002/send-email';
        const requesterEmail = {
            to: purchase.requesterEmail,
            subject: 'Purchase Request Created',
            text: 'Your purchase request has been created and sent for approval.'
        };
        const superiorEmail = {
            to: purchase.superiorEmail,
            subject: 'Purchase Request Approval Needed',
            text: 'A new purchase request needs your approval.'
        };

        // Call notification service
        await fetch(notificationServiceUrl, { method: 'POST', body: JSON.stringify(requesterEmail), headers: { 'Content-Type': 'application/json' }});
        await fetch(notificationServiceUrl, { method: 'POST', body: JSON.stringify(superiorEmail), headers: { 'Content-Type': 'application/json' }});

        res.send('Purchase request created');
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).send('Error creating purchase');
    }
});

// Approve purchase
app.put('/approve-purchase/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndUpdate(req.params.id, { status: 'Approved' });

        const requesterEmail = {
            to: purchase.requesterEmail,
            subject: 'Purchase Request Approved',
            text: 'Your purchase request has been approved.'
        };
        await fetch('http://localhost:3002/send-email', { method: 'POST', body: JSON.stringify(requesterEmail), headers: { 'Content-Type': 'application/json' }});

        res.send('Purchase approved');
    } catch (error) {
        console.error('Error approving purchase:', error);
        res.status(500).send('Error approving purchase');
    }
});

//pending requests
app.get('/pending-requests', async (req, res) => {
    try {
        const pendingRequests = await Purchase.find({ status: 'Pending' });
        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).send('Error fetching pending requests');
    }
})
app.listen(3003, () => console.log('Purchase Service is running on port 3003'));
