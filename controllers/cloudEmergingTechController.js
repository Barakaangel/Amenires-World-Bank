const CloudEmergingTech = require('../models/CloudEmergingTech');
const User = require('../models/User');

class CloudEmergingTechController {
  // Get or create user's cloud tech profile
  async getProfile(req, res) {
    try {
      const { userId } = req.params;
      
      let profile = await CloudEmergingTech.findOne({ userId });
      
      if (!profile) {
        profile = await CloudEmergingTech.create({ userId });
      }
      
      res.json({ profile });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching cloud tech profile',
        details: error.message
      });
    }
  }

  // Update blockchain settings
  async updateBlockchain(req, res) {
    try {
      const { userId } = req.params;
      const { walletAddress, enabled } = req.body;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $set: {
            'blockchain.enabled': enabled,
            'blockchain.walletAddress': walletAddress
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'Blockchain settings updated',
        profile
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating blockchain settings',
        details: error.message
      });
    }
  }

  // Record blockchain transaction
  async recordBlockchainTransaction(req, res) {
    try {
      const { userId } = req.params;
      const { hash, type, amount, currency, status } = req.body;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $push: {
            'blockchain.transactions': {
              hash,
              type,
              amount,
              currency,
              timestamp: new Date(),
              status
            }
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'Transaction recorded',
        profile
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error recording transaction',
        details: error.message
      });
    }
  }

  // Get AI analytics
  async getAIAnalytics(req, res) {
    try {
      const { userId } = req.params;
      
      const profile = await CloudEmergingTech.findOne({ userId });
      
      if (!profile || !profile.aiFeatures) {
        return res.status(404).json({ error: 'AI features not enabled' });
      }
      
      const analytics = await this.generatePredictiveAnalytics(userId);
      
      res.json({
        predictiveAnalytics: profile.aiFeatures.predictiveAnalytics,
        fraudDetection: profile.aiFeatures.fraudDetection,
        personalizedOffers: profile.aiFeatures.personalizedOffers,
        analytics
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching AI analytics',
        details: error.message
      });
    }
  }

  // Run fraud detection scan
  async runFraudDetection(req, res) {
    try {
      const { userId } = req.params;
      
      const profile = await CloudEmergingTech.findOne({ userId });
      
      if (!profile) {
        profile = await CloudEmergingTech.create({ userId });
      }
      
      const alerts = await this.detectFraud(userId);
      
      profile.aiFeatures.fraudDetection.enabled = true;
      profile.aiFeatures.fraudDetection.lastScan = new Date();
      profile.aiFeatures.fraudDetection.alerts.push(...alerts);
      
      await profile.save();
      
      res.json({
        message: 'Fraud detection scan completed',
        alerts,
        riskLevel: alerts.length > 5 ? 'high' : alerts.length > 2 ? 'medium' : 'low'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error running fraud detection',
        details: error.message
      });
    }
  }

  // Register IoT device
  async registerIoTDevice(req, res) {
    try {
      const { userId } = req.params;
      const { deviceId, type, permissions } = req.body;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $push: {
            iotDevices: {
              deviceId,
              type,
              status: 'active',
              lastSeen: new Date(),
              permissions: permissions || []
            }
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'IoT device registered',
        device: profile.iotDevices[profile.iotDevices.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error registering IoT device',
        details: error.message
      });
    }
  }

  // Update IoT device status
  async updateIoTDevice(req, res) {
    try {
      const { userId, deviceId } = req.params;
      const { status, lastSeen } = req.body;
      
      const profile = await CloudEmergingTech.findOne({ userId });
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      const device = profile.iotDevices.find(d => d.deviceId === deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      if (status) device.status = status;
      if (lastSeen) device.lastSeen = lastSeen;
      
      await profile.save();
      
      res.json({
        message: 'Device updated',
        device
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating device',
        details: error.message
      });
    }
  }

  // Register biometric
  async registerBiometric(req, res) {
    try {
      const { userId } = req.params;
      const { type, template } = req.body;
      
      const updateField = `biometrics.${type}`;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $set: {
            [`${updateField}.enabled`]: true,
            [`${updateField}.template`]: template,
            [`${updateField}.registeredAt`]: new Date()
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: `${type} biometric registered`,
        profile
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error registering biometric',
        details: error.message
      });
    }
  }

  // Add cloud service
  async addCloudService(req, res) {
    try {
      const { userId } = req.params;
      const { category, provider, ...serviceDetails } = req.body;
      
      const updateField = `cloudServices.${category}`;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $push: {
            [updateField]: {
              provider,
              ...serviceDetails,
              createdAt: new Date()
            }
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'Cloud service added',
        service: profile.cloudServices[category][profile.cloudServices[category].length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error adding cloud service',
        details: error.message
      });
    }
  }

  // Create digital twin
  async createDigitalTwin(req, res) {
    try {
      const { userId } = req.params;
      const { name, type, description, initialState } = req.body;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $push: {
            digitalTwins: {
              name,
              type,
              description,
              state: initialState || {},
              lastSync: new Date(),
              createdAt: new Date()
            }
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'Digital twin created',
        twin: profile.digitalTwins[profile.digitalTwins.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating digital twin',
        details: error.message
      });
    }
  }

  // Update privacy settings
  async updatePrivacySettings(req, res) {
    try {
      const { userId } = req.params;
      const { dataSharing, encryptionLevel, anonymizationEnabled } = req.body;
      
      const profile = await CloudEmergingTech.findOneAndUpdate(
        { userId },
        {
          $set: {
            'privacySettings.dataSharing': dataSharing,
            'privacySettings.encryptionLevel': encryptionLevel,
            'privacySettings.anonymizationEnabled': anonymizationEnabled
          }
        },
        { new: true, upsert: true }
      );
      
      res.json({
        message: 'Privacy settings updated',
        settings: profile.privacySettings
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating privacy settings',
        details: error.message
      });
    }
  }

  // Helper method to generate predictive analytics
  async generatePredictiveAnalytics(userId) {
    // In real implementation, integrate with ML/AI service
    return {
      nextLikelyTransaction: 'transfer',
      spendingCategory: 'food',
      confidence: 0.85,
      timeframe: '24 hours'
    };
  }

  // Helper method to detect fraud
  async detectFraud(userId) {
    // In real implementation, integrate with fraud detection service
    const alerts = [];
    
    // Simulate some alerts
    if (Math.random() > 0.8) {
      alerts.push({
        type: 'unusual_location',
        severity: 'medium',
        description: 'Transaction from new location',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    if (Math.random() > 0.9) {
      alerts.push({
        type: 'unusual_amount',
        severity: 'high',
        description: 'Unusually large transaction',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    return alerts;
  }
}

module.exports = new CloudEmergingTechController();
