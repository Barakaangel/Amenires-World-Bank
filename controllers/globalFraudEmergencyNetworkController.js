const GlobalFraudEmergencyNetwork = require('../models/GlobalFraudEmergencyNetwork');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

class GlobalFraudEmergencyNetworkController {
  // Create or get fraud network profile
  async getProfile(req, res) {
    try {
      const userId = String(req.params.userId);

      let profile = await GlobalFraudEmergencyNetwork.findOne({ userId: { $eq: userId } });

      if (!profile) {
        profile = await GlobalFraudEmergencyNetwork.create({ userId });
      }

      res.json({ profile });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching fraud network profile',
        details: error.message
      });
    }
  }

  // Run fraud detection
  async runFraudDetection(req, res) {
    try {
      const userId = String(req.params.userId);

      let profile = await GlobalFraudEmergencyNetwork.findOne({ userId: { $eq: userId } });
      if (!profile) {
        profile = await GlobalFraudEmergencyNetwork.create({ userId });
      }

      const alerts = await this.detectFraud(userId, req);
      const riskScore = await this.calculateRiskScore(userId, alerts);

      profile.fraudDetection.riskScore = riskScore;
      profile.fraudDetection.riskLevel = this.getRiskLevel(riskScore);
      profile.fraudDetection.lastAssessment = new Date();

      // Add new alerts
      for (const alert of alerts) {
        const existingAlert = profile.alerts.find(a => a.alertId === alert.alertId);
        if (!existingAlert) {
          profile.alerts.push(alert);
        }
      }

      await profile.save();

      res.json({
        message: 'Fraud detection completed',
        riskScore,
        riskLevel: profile.fraudDetection.riskLevel,
        newAlerts: alerts,
        totalAlerts: profile.alerts.filter(a => a.status === 'open').length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error running fraud detection',
        details: error.message
      });
    }
  }

  // Register device
  async registerDevice(req, res) {
    try {
      const { userId } = req.params;
      const { userAgent, browser, os, screenResolution, timezone, language, location } = req.body;

      let profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        profile = await GlobalFraudEmergencyNetwork.create({ userId });
      }

      const deviceId = crypto.createHash('sha256').update(userAgent + Date.now()).digest('hex').substring(0, 32);

      const device = {
        deviceId,
        userAgent,
        browser,
        os,
        screenResolution,
        timezone,
        language,
        firstSeen: new Date(),
        lastSeen: new Date(),
        isTrusted: false,
        riskScore: 0,
        locationHistory: location ? [{
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country,
          timestamp: new Date()
        }] : []
      };

      // Check if this is a known device pattern
      const existingDevice = profile.devices.find(d => 
        d.userAgent === userAgent && d.os === os
      );

      if (existingDevice) {
        existingDevice.lastSeen = new Date();
        if (location) {
          existingDevice.locationHistory.push({
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
            country: location.country,
            timestamp: new Date()
          });
        }
      } else {
        profile.devices.push(device);
      }

      await profile.save();

      res.json({
        message: 'Device registered',
        device: existingDevice || device
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error registering device',
        details: error.message
      });
    }
  }

  // Trigger emergency action
  async triggerEmergencyAction(req, res) {
    try {
      const { userId } = req.params;
      const { type, reason, triggeredBy, duration } = req.body;

      let profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        profile = await GlobalFraudEmergencyNetwork.create({ userId });
      }

      const action = {
        actionId: `ACT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        type,
        triggeredBy: triggeredBy || 'system',
        reason,
        executedAt: new Date(),
        expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null,
        status: 'active'
      };

      // Execute the action
      await this.executeAction(userId, type, reason);

      profile.emergencyActions.push(action);

      if (type === 'account_freeze') {
        profile.recovery.accountFrozen = true;
        profile.recovery.freezeReason = reason;
        profile.recovery.frozenAt = new Date();
        profile.recovery.freezeExpiresAt = action.expiresAt;
      }

      await profile.save();

      // Send notification to user
      await this.sendNotification(userId, type, reason);

      res.json({
        message: 'Emergency action triggered',
        action
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error triggering emergency action',
        details: error.message
      });
    }
  }

  // Resolve alert
  async resolveAlert(req, res) {
    try {
      const { userId, alertId } = req.params;
      const { status, notes } = req.body;

      const profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const alert = profile.alerts.find(a => a.alertId === alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      alert.status = status || 'resolved';
      alert.notes = notes || alert.notes;
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user ? req.user.id : null;
      alert.updatedAt = new Date();

      // Update analytics
      if (status === 'false_positive') {
        profile.analytics.falsePositives = (profile.analytics.falsePositives || 0) + 1;
      } else if (status === 'resolved') {
        profile.analytics.truePositives = (profile.analytics.truePositives || 0) + 1;
      }

      profile.analytics.resolvedAlerts = (profile.analytics.resolvedAlerts || 0) + 1;
      profile.analytics.detectionAccuracy = this.calculateDetectionAccuracy(profile);

      await profile.save();

      res.json({
        message: 'Alert resolved',
        alert
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error resolving alert',
        details: error.message
      });
    }
  }

  // Get alerts
  async getAlerts(req, res) {
    try {
      const { userId } = req.params;
      const { status, severity, limit = 50 } = req.query;

      const profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        return res.json({ alerts: [] });
      }

      let alerts = profile.alerts;

      if (status) {
        alerts = alerts.filter(a => a.status === status);
      }
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }

      alerts = alerts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, parseInt(limit));

      res.json({ alerts });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching alerts',
        details: error.message
      });
    }
  }

  // Unfreeze account
  async unfreezeAccount(req, res) {
    try {
      const { userId } = req.params;

      const profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (!profile.recovery.accountFrozen) {
        return res.status(400).json({ error: 'Account is not frozen' });
      }

      // Check if verification is required
      if (profile.verification.required && !profile.verification.completedAt) {
        return res.status(400).json({
          error: 'Verification required before unfreezing account',
          verificationRequired: true
        });
      }

      // Unfreeze account
      await this.executeAction(userId, 'account_unfreeze', 'Manual unfreeze');

      profile.recovery.accountFrozen = false;
      profile.recovery.freezeExpiresAt = null;

      // Mark emergency actions as expired
      profile.emergencyActions
        .filter(a => a.type === 'account_freeze' && a.status === 'active')
        .forEach(a => {
          a.status = 'expired';
          a.expiresAt = new Date();
        });

      await profile.save();

      res.json({
        message: 'Account unfrozen successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error unfreezing account',
        details: error.message
      });
    }
  }

  // Submit verification documents
  async submitVerification(req, res) {
    try {
      const { userId } = req.params;
      const { type, documents } = req.body;

      let profile = await GlobalFraudEmergencyNetwork.findOne({ userId });
      if (!profile) {
        profile = await GlobalFraudEmergencyNetwork.create({ userId });
      }

      profile.verification.required = true;
      profile.verification.type = type;
      profile.verification.requestedAt = new Date();

      for (const doc of documents) {
        profile.verification.documents.push({
          type: doc.type,
          url: doc.url,
          status: 'pending'
        });
      }

      await profile.save();

      res.json({
        message: 'Verification documents submitted',
        documents: profile.verification.documents
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error submitting verification',
        details: error.message
      });
    }
  }

  // Helper methods
  async detectFraud(userId, req) {
    const alerts = [];
    const user = await User.findById(userId);

    if (!user) return alerts;

    // Check for unusual login location
    if (req.ip && req.location) {
      const recentLogins = user.lastLogins || [];
      const unusualLocation = recentLogins.some(login => {
        const distance = this.calculateDistance(req.location, login.location);
        return distance > 500; // More than 500km
      });

      if (unusualLocation) {
        alerts.push({
          alertId: `ALT${Date.now()}`,
          type: 'login_unusual',
          severity: 'medium',
          description: 'Login from unusual location detected',
          details: {
            currentLocation: req.location,
            ipAddress: req.ip
          },
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    // Check for suspicious transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentAmounts = transactions.map(t => t.amount);
    const avgAmount = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length;

    for (const transaction of transactions) {
      if (transaction.amount > avgAmount * 10) {
        alerts.push({
          alertId: `TRN${Date.now()}`,
          type: 'transaction_suspicious',
          severity: 'high',
          description: 'Unusually large transaction detected',
          details: {
            transactionId: transaction._id,
            amount: transaction.amount,
            averageAmount: avgAmount,
            ratio: transaction.amount / avgAmount
          },
          relatedTransactionId: transaction._id,
          status: 'open',
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  async calculateRiskScore(userId, alerts) {
    const profile = await GlobalFraudEmergencyNetwork.findOne({ userId });

    let score = 0;

    // Add score based on alert severity
    for (const alert of alerts) {
      switch (alert.severity) {
        case 'critical':
          score += 40;
          break;
        case 'high':
          score += 25;
          break;
        case 'medium':
          score += 15;
          break;
        case 'low':
          score += 5;
          break;
      }
    }

    // Consider existing open alerts
    if (profile) {
      const openAlerts = profile.alerts.filter(a => a.status === 'open');
      score += openAlerts.length * 10;
    }

    return Math.min(100, score);
  }

  getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async executeAction(userId, type, reason) {
    const user = await User.findById(userId);

    switch (type) {
      case 'account_freeze':
        if (user) {
          user.status = 'frozen';
          await user.save();
        }
        break;
      case 'card_block':
        // Block all cards associated with user
        break;
      case 'force_logout':
        // Invalidate all sessions
        break;
      case 'account_unfreeze':
        if (user) {
          user.status = 'active';
          await user.save();
        }
        break;
    }
  }

  async sendNotification(userId, type, reason) {
    const user = await User.findById(userId);

    if (user && user.email) {
      // In real implementation, send email/SMS/push notification
      console.log(`Notification sent to ${user.email}: ${type} - ${reason}`);
    }
  }

  calculateDetectionAccuracy(profile) {
    const total = (profile.analytics.truePositives || 0) + (profile.analytics.falsePositives || 0);
    if (total === 0) return 100;
    return ((profile.analytics.truePositives || 0) / total) * 100;
  }
}

module.exports = new GlobalFraudEmergencyNetworkController();
