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

export const calculatePrice = (product, rules) => {
    if (!product || !rules) return product?.basePriceCents || 0;

    const activeRules = rules
        .filter(rule => rule.active)
        .sort((a, b) => {
            // Primary sort by priority
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Secondary sort by creation date (tie-breaker)
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

    const matchingRule = activeRules.find(rule => ruleMatches(product, rule));

    if (!matchingRule) {
        return product.basePriceCents;
    }

    // Apply the rule
    return applyRule(product.basePriceCents, matchingRule);
};

export const calculateAllPrices = (products, rules) => {
    if (!products) return [];
    return products.map(product => ({
        ...product,
        proposedPriceCents: calculatePrice(product, rules),
    }));
};