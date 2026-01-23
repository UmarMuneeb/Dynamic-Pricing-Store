import React, { useMemo } from 'react';

const RulePreviewTable = ({ products, rule }) => {
    const formatPrice = (cents) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const ruleMatches = (product, rule) => {
        switch (rule.conditionType) {
            case 'category_is':
                return product.category === rule.conditionValue;
            case 'stock_less_than':
                return product.stockQuantity < parseInt(rule.conditionValue);
            case 'stock_greater_than':
                return product.stockQuantity > parseInt(rule.conditionValue);
            default:
                return false;
        }
    };

    const applyRule = (basePriceCents, rule) => {
        const actionValue = parseFloat(rule.actionValue);

        switch (rule.actionType) {
            case 'increase_percentage':
                return Math.round(basePriceCents * (1 + actionValue / 100));
            case 'decrease_percentage':
                return Math.max(0, Math.round(basePriceCents * (1 - actionValue / 100)));
            case 'increase_fixed':
                return basePriceCents + parseInt(rule.actionValue);
            case 'decrease_fixed':
                return Math.max(0, basePriceCents - parseInt(rule.actionValue));
            default:
                return basePriceCents;
        }
    };

    // Calculate which products are affected by this rule
    const affectedProducts = useMemo(() => {
        if (!rule || !rule.conditionType || !rule.conditionValue) {
            return [];
        }

        return products.filter(product => ruleMatches(product, rule));
    }, [products, rule]);

    // Calculate proposed prices for affected products
    const productsWithProposedPrices = useMemo(() => {
        if (!rule || !rule.actionType || !rule.actionValue) {
            return affectedProducts.map(p => ({
                ...p,
                proposedPriceCents: p.basePriceCents,
                priceDifference: 0
            }));
        }

        return affectedProducts.map(product => {
            const proposedPrice = applyRule(product.basePriceCents, rule);
            return {
                ...product,
                proposedPriceCents: proposedPrice,
                priceDifference: proposedPrice - product.basePriceCents,
            };
        });
    }, [affectedProducts, rule]);

    const getPriceChangeClass = (difference) => {
        if (difference > 0) return 'text-green-600';
        if (difference < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Electronics': 'bg-blue-100 text-blue-800',
            'Clothing': 'bg-purple-100 text-purple-800',
            'Home & Garden': 'bg-green-100 text-green-800',
            'Sports': 'bg-orange-100 text-orange-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    if (productsWithProposedPrices.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-4">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products match this rule</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Adjust the condition to see which products will be affected.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden mt-4">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Preview: Affected Products
                    <span className="ml-2 text-sm font-normal text-gray-600">
                        ({productsWithProposedPrices.length} {productsWithProposedPrices.length === 1 ? 'product' : 'products'})
                    </span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    These products will be affected when this rule is applied
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Base Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Proposed Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Change
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productsWithProposedPrices.map((product) => {
                            const priceDiff = product.priceDifference || 0;
                            const percentChange = product.basePriceCents > 0
                                ? ((priceDiff / product.basePriceCents) * 100).toFixed(1)
                                : 0;

                            return (
                                <tr key={product._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className={`text-sm font-medium ${product.stockQuantity < 10
                                                ? 'text-red-600'
                                                : product.stockQuantity < 50
                                                    ? 'text-yellow-600'
                                                    : 'text-green-600'
                                                }`}>
                                                {product.stockQuantity}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatPrice(product.basePriceCents)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getPriceChangeClass(priceDiff)}`}>
                                        {formatPrice(product.proposedPriceCents)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPriceChangeClass(priceDiff)}`}>
                                        {priceDiff !== 0 ? (
                                            <div className="flex flex-col">
                                                <span>
                                                    {priceDiff > 0 ? '+' : ''}
                                                    {formatPrice(Math.abs(priceDiff))}
                                                </span>
                                                <span className="text-xs">
                                                    ({priceDiff > 0 ? '+' : ''}{percentChange}%)
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RulePreviewTable;
