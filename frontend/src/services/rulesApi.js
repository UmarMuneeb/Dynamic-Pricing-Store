import api from './productApi';

export const rulesAPI = {
  getAll: () => api.get('/pricing_rules'),
  create: (rule) => api.post('/pricing_rules', { pricing_rule: rule }),
  update: (id, rule) => api.put(`/pricing_rules/${id}`, { pricing_rule: rule }),
  delete: (id) => api.delete(`/pricing_rules/${id}`),
  applyRules: () => api.post('/pricing_rules/apply'),

  // Get the status of a pricing log
  getPricingLogStatus: (logId) => api.get(`/pricing_logs/${logId}`),

  // Get all pricing logs
  getLogs: () => api.get('/pricing_logs'),

  pollUntilComplete: async (logId, maxAttempts = 30, intervalMs = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await api.get(`/pricing_logs/${logId}`);
      const status = response.data.status;

      if (status === 'success' || status === 'failed') {
        return response.data;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Polling timeout: Job did not complete in time');
  }
};