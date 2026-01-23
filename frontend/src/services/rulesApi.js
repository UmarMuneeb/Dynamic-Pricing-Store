import api from './productApi';

export const rulesAPI = {
  getAll: () => api.get('/pricing_rules'),
  create: (rule) => api.post('/pricing_rules', { pricing_rule: rule }),
  update: (id, rule) => api.put(`/pricing_rules/${id}`, { pricing_rule: rule }),
  delete: (id) => api.delete(`/pricing_rules/${id}`),
  applyRules: () => api.post('/pricing_rules/apply'),
};