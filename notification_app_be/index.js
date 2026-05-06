const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');

const app = express();
app.use(express.json());

// Dummy connection string - to be replaced with actual DB URI later
// mongoose.connect('mongodb://localhost:27017/notifications_db');

// =======================
//      DUMMY ROUTES
// =======================

// 1. Fetch Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.json({ message: "Dummy route to fetch list of notifications." });
});

// 2. Get Unread Count
app.get('/api/v1/notifications/unread-count', (req, res) => {
  res.json({ data: { count: 0 }, message: "Dummy route for unread count." });
});

// 3. Mark specific notification as read
app.patch('/api/v1/notifications/:id/read', (req, res) => {
  res.json({ message: `Dummy route to mark notification ${req.params.id} as read.` });
});

// 4. Mark all as read
app.post('/api/v1/notifications/read-all', (req, res) => {
  res.json({ message: "Dummy route to mark all notifications as read." });
});

// 5. Priority Inbox
app.get('/api/v1/notifications/priority', (req, res) => {
  res.json({ message: "Dummy route to fetch top 10 priority notifications." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});
