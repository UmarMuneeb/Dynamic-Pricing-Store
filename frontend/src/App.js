import React, { useState, useEffect } from 'react';
import { productsAPI } from './services/productApi';
import { rulesAPI } from './services/rulesApi';
import ProductsTable from './components/productTables';
import RulesList from './components/rulesList';
import RuleForm from './components/rulesForm';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, products, rules

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, rulesRes] = await Promise.all([
        productsAPI.getAll(),
        rulesAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setRules(rulesRes.data);
      console.log('Fetched rules:', rulesRes.data.map(r => ({ id: r.id, name: r.name })));
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Make sure the backend is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData) => {
    try {
      await rulesAPI.create(ruleData);
      // Auto-apply rules if the new rule is active
      if (ruleData.active) {
        await rulesAPI.applyRules();
      }
      await fetchData();
      setShowRuleForm(false);
      alert('Rule created and applied successfully!');
    } catch (err) {
      alert('Failed to create rule: ' + (err.response?.data?.errors?.join(', ') || err.message));
    }
  };

  const handleUpdateRule = async (ruleData) => {
    if (!editingRule || !editingRule.id) {
      alert('Error: Cannot update - Rule ID is missing');
      console.error('Update attempted with no editing rule ID');
      return;
    }
    try {
      console.log('Updating rule with ID:', editingRule.id);
      await rulesAPI.update(editingRule.id, ruleData);
      // Auto-apply rules after update
      await rulesAPI.applyRules();
      await fetchData();
      setEditingRule(null);
      setShowRuleForm(false);
      alert('Rule updated and applied successfully!');
    } catch (err) {
      alert('Failed to update rule: ' + (err.response?.data?.errors?.join(', ') || err.message));
      console.error('Update error:', err);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    if (!ruleId) {
      alert('Error: Rule ID is missing');
      console.error('Delete attempted with no ruleId');
      return;
    }
    try {
      console.log('Deleting rule with ID:', ruleId);
      await rulesAPI.delete(ruleId);
      await fetchData();
      alert('Rule deleted successfully!');
    } catch (err) {
      alert('Failed to delete rule: ' + err.message);
      console.error('Delete error:', err);
    }
  };

  const handleToggleRule = async (rule) => {
    if (!rule || !rule.id) {
      alert('Error: Rule or Rule ID is missing');
      console.error('Toggle attempted with invalid rule:', rule);
      return;
    }
    try {
      console.log('Toggling rule with ID:', rule.id, 'Current active:', rule.active);
      const updatedRule = {
        name: rule.name,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue,
        actionType: rule.actionType,
        actionValue: rule.actionValue,
        priority: rule.priority,
        active: !rule.active
      };
      console.log('Updated rule data for toggle:', updatedRule);
      await rulesAPI.update(rule.id, updatedRule);
      // Auto-apply rules after toggle
      await rulesAPI.applyRules();
      await fetchData();
    } catch (err) {
      alert('Failed to toggle rule: ' + err.message);
      console.error('Toggle error:', err, 'Rule:', rule);
    }
  };

  const handleEditRule = (rule) => {
    if (!rule || !rule.id) {
      alert('Error: Cannot edit - Rule or Rule ID is missing');
      console.error('Edit attempted with invalid rule:', rule);
      return;
    }
    console.log('Editing rule:', rule.id, rule.name);
    setEditingRule(rule);
    setShowRuleForm(true);
  };

  const handleCancelForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Dynamic Pricing Engine
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Intelligent pricing rules for your inventory
              </p>
            </div>
            {activeTab === 'rules' && !showRuleForm && (
              <button
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
                onClick={() => setShowRuleForm(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Rule
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products ({products.length})
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('rules'); setShowRuleForm(false); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pricing Rules ({rules.length})
              </div>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Rules</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {rules.filter(r => r.active).length}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {products.filter(p => p.stockQuantity < 10).length}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-full">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Overview */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <span className="text-gray-600">Categories</span>
                      <span className="font-semibold text-gray-900">
                        {[...new Set(products.map(p => p.category))].length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b">
                      <span className="text-gray-600">Total Pricing Rules</span>
                      <span className="font-semibold text-gray-900">{rules.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Inventory Value</span>
                      <span className="font-semibold text-gray-900">
                        ${(products.reduce((sum, p) => sum + (p.currentPriceCents * p.stockQuantity), 0) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products View */}
            {activeTab === 'products' && (
              <ProductsTable products={products} />
            )}

            {/* Rules View */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                {showRuleForm && (
                  <RuleForm
                    onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
                    onCancel={handleCancelForm}
                    initialRule={editingRule}
                    products={products}
                  />
                )}

                <RulesList
                  rules={rules}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggle={handleToggleRule}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;