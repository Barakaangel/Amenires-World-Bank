const DirectSalesAgent = require('../models/DirectSalesAgent');
const User = require('../models/User');

class DirectSalesAgentController {
  // Create agent profile
  async createAgent(req, res) {
    try {
      const { userId } = req.params;
      const { profile, certifications, territory, branchId } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if agent already exists
      const existingAgent = await DirectSalesAgent.findOne({ userId });
      if (existingAgent) {
        return res.status(400).json({ error: 'Agent profile already exists' });
      }

      const agentId = `AGT${Date.now()}`;

      const agent = await DirectSalesAgent.create({
        agentId,
        userId,
        profile: {
          ...profile,
          territory,
          branchId
        },
        certifications: certifications || [],
        hiringDate: new Date()
      });

      // Update user role to agent
      user.role = 'agent';
      await user.save();

      res.status(201).json({
        message: 'Agent profile created successfully',
        agent
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating agent profile',
        details: error.message
      });
    }
  }

  // Get agent profile
  async getAgentProfile(req, res) {
    try {
      const { agentId } = req.params;

      const agent = await DirectSalesAgent.findOne({ agentId })
        .populate('userId', 'name email phone');

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({ agent });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching agent profile',
        details: error.message
      });
    }
  }

  // Add client
  async addClient(req, res) {
    try {
      const { agentId } = req.params;
      const { clientId, notes } = req.body;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if client already exists
      const existingClient = agent.clients.find(c => c.clientId.toString() === clientId);
      if (existingClient) {
        return res.status(400).json({ error: 'Client already exists' });
      }

      agent.clients.push({
        clientId,
        relationshipDate: new Date(),
        status: 'active',
        notes,
        totalValue: 0
      });

      await agent.save();

      res.status(201).json({
        message: 'Client added successfully',
        client: agent.clients[agent.clients.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error adding client',
        details: error.message
      });
    }
  }

  // Get all clients
  async getClients(req, res) {
    try {
      const { agentId } = req.params;
      const { status } = req.query;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      let clients = agent.clients;
      if (status) {
        clients = clients.filter(c => c.status === status);
      }

      // Populate client details
      const clientsWithDetails = await Promise.all(
        clients.map(async (client) => {
          const user = await User.findById(client.clientId);
          return {
            ...client._doc,
            clientDetails: user ? {
              name: user.name,
              email: user.email,
              phone: user.phone
            } : null
          };
        })
      );

      res.json({
        clients: clientsWithDetails,
        total: clientsWithDetails.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching clients',
        details: error.message
      });
    }
  }

  // Create lead
  async createLead(req, res) {
    try {
      const { agentId } = req.params;
      const { name, phone, email, source, value, notes } = req.body;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const lead = {
        leadId: `LD${Date.now()}`,
        name,
        phone,
        email,
        source,
        value,
        notes,
        probability: 20, // Default probability
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      agent.leads.push(lead);
      await agent.save();

      res.status(201).json({
        message: 'Lead created successfully',
        lead
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating lead',
        details: error.message
      });
    }
  }

  // Update lead
  async updateLead(req, res) {
    try {
      const { agentId, leadId } = req.params;
      const { status, probability, notes, followUpDate } = req.body;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const lead = agent.leads.find(l => l.leadId === leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      if (status) lead.status = status;
      if (probability !== undefined) lead.probability = probability;
      if (notes) lead.notes = notes;
      if (followUpDate) lead.followUpDate = new Date(followUpDate);
      lead.updatedAt = new Date();

      await agent.save();

      res.json({
        message: 'Lead updated successfully',
        lead
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating lead',
        details: error.message
      });
    }
  }

  // Get leads
  async getLeads(req, res) {
    try {
      const { agentId } = req.params;
      const { status } = req.query;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      let leads = agent.leads;
      if (status) {
        leads = leads.filter(l => l.status === status);
      }

      leads = leads.sort((a, b) => b.createdAt - a.createdAt);

      res.json({
        leads,
        total: leads.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching leads',
        details: error.message
      });
    }
  }

  // Create activity
  async createActivity(req, res) {
    try {
      const { agentId } = req.params;
      const { clientId, type, description, scheduledDate, duration } = req.body;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const activity = {
        activityId: `ACT${Date.now()}`,
        type,
        clientId,
        description,
        duration,
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled'
      };

      agent.activities.push(activity);
      await agent.save();

      res.status(201).json({
        message: 'Activity created successfully',
        activity
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating activity',
        details: error.message
      });
    }
  }

  // Get activities
  async getActivities(req, res) {
    try {
      const { agentId } = req.params;
      const { status, startDate, endDate } = req.query;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      let activities = agent.activities;

      if (status) {
        activities = activities.filter(a => a.status === status);
      }
      if (startDate) {
        activities = activities.filter(a => new Date(a.scheduledDate) >= new Date(startDate));
      }
      if (endDate) {
        activities = activities.filter(a => new Date(a.scheduledDate) <= new Date(endDate));
      }

      activities = activities.sort((a, b) => b.scheduledDate - a.scheduledDate);

      res.json({
        activities,
        total: activities.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching activities',
        details: error.message
      });
    }
  }

  // Get sales performance
  async getPerformance(req, res) {
    try {
      const { agentId } = req.params;
      const { period } = req.query;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const performance = {
        tier: agent.performance.tier,
        totalSales: agent.performance.totalSales,
        targets: agent.performance.targets,
        achievements: agent.performance.achievements,
        commission: {
          structure: agent.commission.structure,
          totalCommission: agent.commission.totalCommission,
          commissionThisMonth: agent.commission.commissionThisMonth,
          commissionThisQuarter: agent.commission.commissionThisQuarter,
          commissionThisYear: agent.commission.commissionThisYear
        },
        analytics: agent.analytics
      };

      res.json({ performance });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching performance',
        details: error.message
      });
    }
  }

  // Update commission rates
  async updateCommissionRates(req, res) {
    try {
      const { agentId } = req.params;
      const { rates } = req.body;

      const agent = await DirectSalesAgent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      agent.commission.rates = rates;
      await agent.save();

      res.json({
        message: 'Commission rates updated',
        rates: agent.commission.rates
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating commission rates',
        details: error.message
      });
    }
  }

  // Get all agents (admin)
  async getAllAgents(req, res) {
    try {
      const { status, tier, territory } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (tier) filter['performance.tier'] = tier;
      if (territory) filter['profile.territory'] = territory;

      const agents = await DirectSalesAgent.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });

      res.json({
        agents,
        total: agents.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching agents',
        details: error.message
      });
    }
  }
}

module.exports = new DirectSalesAgentController();
