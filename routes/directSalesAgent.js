const express = require('express');
const router = express.Router();
const directSalesAgentController = require('../controllers/directSalesAgentController');
const { authenticate, authorize } = require('../middleware/auth');

// Agent management
router.post('/:userId/agent',
  authenticate,
  directSalesAgentController.createAgent
);

router.get('/agent/:agentId',
  authenticate,
  directSalesAgentController.getAgentProfile
);

router.get('/agents',
  authenticate,
  authorize('admin', 'staff'),
  directSalesAgentController.getAllAgents
);

// Client management
router.post('/:agentId/clients',
  authenticate,
  directSalesAgentController.addClient
);

router.get('/:agentId/clients',
  authenticate,
  directSalesAgentController.getClients
);

// Lead management
router.post('/:agentId/leads',
  authenticate,
  directSalesAgentController.createLead
);

router.put('/:agentId/leads/:leadId',
  authenticate,
  directSalesAgentController.updateLead
);

router.get('/:agentId/leads',
  authenticate,
  directSalesAgentController.getLeads
);

// Activity management
router.post('/:agentId/activities',
  authenticate,
  directSalesAgentController.createActivity
);

router.get('/:agentId/activities',
  authenticate,
  directSalesAgentController.getActivities
);

// Performance
router.get('/:agentId/performance',
  authenticate,
  directSalesAgentController.getPerformance
);

router.put('/:agentId/commission',
  authenticate,
  authorize('admin'),
  directSalesAgentController.updateCommissionRates
);

module.exports = router;
