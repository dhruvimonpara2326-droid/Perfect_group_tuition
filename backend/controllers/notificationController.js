const Notification = require('../models/Notification');

// GET /api/notifications?userId=...&role=...&standard=...
const getNotifications = async (req, res) => {
  try {
    const { userId, role, standard } = req.query;
    const filter = {};

    if (userId) {
      // Build conditions: direct user notifications OR broadcast notifications for user's role
      const orConditions = [
        { userId },           // notifications sent directly to this user
        { forRole: 'all' }    // notifications sent to everyone
      ];

      // Match notifications sent to the user's role (student/faculty)
      if (role) {
        if (standard) {
          orConditions.push(
            { forRole: role, forStandard: standard },
            { forRole: role, forStandard: { $in: ['', null] } },
            { forRole: role, forStandard: { $exists: false } }
          );
        } else {
          orConditions.push({ forRole: role });
        }
      }

      filter.$or = orConditions;
    } else if (role) {
      // No userId — just filter by role (e.g., faculty dashboard)
      filter.$or = [
        { forRole: role },
        { forRole: 'all' }
      ];
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/notifications
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, forRole, forStandard } = req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'general',
      forRole,
      forStandard
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id
const updateNotification = async (req, res) => {
  try {
    const { title, message, type, forRole, forStandard } = req.body;
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message, type, forRole, forStandard },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, createNotification, markAsRead, updateNotification, deleteNotification };
