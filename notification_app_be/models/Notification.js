const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  type: { type: String, enum: ['EVENT', 'RESULT', 'PLACEMENT'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  actionUrl: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Compound indexes for efficient querying as outlined in the system design
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
