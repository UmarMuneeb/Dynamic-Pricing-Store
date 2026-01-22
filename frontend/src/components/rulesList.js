import React from 'react';

const RulesList = ({ rules, onEdit, onDelete, onToggle }) => {
  const formatCondition = (rule) => {
    const typeLabels = {
      category_is: 'Category is',
      stock_less_than: 'Stock <',
      stock_greater_than: 'Stock >',
    };
    return `${typeLabels[rule.conditionType]} "${rule.conditionValue}"`;
  };

  const formatAction = (rule) => {
    const typeLabels = {
      increase_percentage: `+${rule.actionValue}%`,
      decrease_percentage: `-${rule.actionValue}%`,
      increase_fixed: `+$${(rule.actionValue / 100).toFixed(2)}`,
      decrease_fixed: `-$${(rule.actionValue / 100).toFixed(2)}`,
    };
    return typeLabels[rule.actionType];
  };

  return (
    <div>
      {rules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pricing rules yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div 
              key={rule.id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
                !rule.active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      #{rule.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {rule.name}
                      </h3>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={rule.active}
                      onChange={() => onToggle(rule)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">IF</span>
                      <div className="h-px flex-1 bg-gray-300"></div>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{formatCondition(rule)}</p>
                  </div>

                  <div className="flex justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 uppercase">THEN</span>
                      <div className="h-px flex-1 bg-blue-200"></div>
                    </div>
                    <p className="text-sm text-blue-700 font-bold">{formatAction(rule)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm font-medium" 
                    onClick={() => onEdit(rule)}
                  >
                    Edit
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm font-medium" 
                    onClick={() => onDelete(rule.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesList;