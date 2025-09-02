const { User, Application } = require('../database');
const { APPLICATION_STATUS, MESSAGES } = require('../utils/constants');

// Handle application approval/rejection from admin
const handleApplicationStatus = async (bot, userId, status, adminNote = '') => {
  try {
    // Update user application status
    await User.findOneAndUpdate(
      { userId },
      { 
        applicationStatus: status,
        updatedAt: new Date()
      }
    );

    // Update application in database
    await Application.findOneAndUpdate(
      { userId, status: 'submitted' },
      { 
        status: status === APPLICATION_STATUS.APPROVED ? 'approved' : 'rejected',
        processedAt: new Date(),
        adminNote
      }
    );

    // Send notification to user
    let message = '';
    if (status === APPLICATION_STATUS.APPROVED) {
      message = MESSAGES.APPLICATION_APPROVED;
    } else {
      message = MESSAGES.APPLICATION_REJECTED;
      if (adminNote) {
        message += `\n\n📝 Admin note: ${adminNote}`;
      }
    }

    await bot.sendMessage(userId, message);
    
    return true;
  } catch (error) {
    console.error('Error handling application status:', error);
    return false;
  }
};

// Get user application statistics for admin
const getApplicationStats = async () => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$applicationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      applications: stats,
      users: userStats
    };
  } catch (error) {
    console.error('Error getting application stats:', error);
    return null;
  }
};

// Get pending applications for admin review
const getPendingApplications = async () => {
  try {
    const pendingApps = await Application.find({ status: 'submitted' })
      .sort({ submittedAt: 1 })
      .limit(10);

    const result = [];
    
    for (const app of pendingApps) {
      const user = await User.findOne({ userId: app.userId });
      result.push({
        application: app,
        user: user
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting pending applications:', error);
    return [];
  }
};

module.exports = {
  handleApplicationStatus,
  getApplicationStats,
  getPendingApplications
};