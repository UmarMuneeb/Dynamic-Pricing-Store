import React, { useState, useMemo } from 'react';
import RulePreviewTable from './RulePreviewTable';

const RuleForm = ({ onSubmit, onCancel, initialRule = null, products = [], allRules = [] }) => {
  const [formData, setFormData] = useState(initialRule || {
    name: '',
    conditionType: 'category_is',
    conditionValue: '',
    actionType: 'increase_percentage',
    actionValue: '',
    priority: 1,
    active: true,
  });

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.filter(Boolean).sort();
  }, [products]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="bg-white rounded-lg shadow-md p-6 mb-6" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {initialRule ? 'Edit Rule' : 'Create New Rule'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rule Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Low Stock Premium"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Type
            </label>
            <select
              name="conditionType"
              value={formData.conditionType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="category_is">Category is</option>
              <option value="stock_less_than">Stock less than</option>
              <option value="stock_greater_than">Stock greater than</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Value
            </label>
            {formData.conditionType === 'category_is' ? (
              <select
                name="conditionValue"
                value={formData.conditionValue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                name="conditionValue"
                value={formData.conditionValue}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              name="actionType"
              value={formData.actionType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="increase_percentage">Increase by %</option>
              <option value="decrease_percentage">Decrease by %</option>
              <option value="increase_fixed">Increase by $ (cents)</option>
              <option value="decrease_fixed">Decrease by $ (cents)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Value
            </label>
            <input
              type="number"
              name="actionValue"
              min="0"
              value={formData.actionValue}
              onChange={handleChange}
              placeholder={formData.actionType.includes('percentage') ? '10' : '500'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority (1 = highest)
            </label>
            <input
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview of affected products */}
      <RulePreviewTable products={products} rule={formData} allRules={allRules} />

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          {initialRule ? 'Update Rule' : 'Create Rule'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default RuleForm;