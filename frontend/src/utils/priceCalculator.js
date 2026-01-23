export const calculatePrice = (product, rules) => {
    const activeRules = rules
        .filter(rule => rule.active)
        .sort((a, b) => a.priority - b.priority);

    const matchingRule = activeRules.find(rule => ruleMatches(product, rule));

    if (!matchingRule) {
        return product.base_price_cents;
    }

    // Apply the rule
    return applyRule(product.base_price_cents, matchingRule);
};

const ruleMatches = (product, rule) => {
    switch (rule.condition_type) {
        case 'category_is':
            return product.category === rule.condition_value;

        case 'stock_less_than':
            return product.stock_quantity < parseInt(rule.condition_value);

        case 'stock_greater_than':
            return product.stock_quantity > parseInt(rule.condition_value);

        default:
            return false;
    }
};

const applyRule = (basePriceCents, rule) => {
    const actionValue = parseFloat(rule.action_value);

    switch (rule.action_type) {
        case 'increase_percentage':
            return Math.round(basePriceCents * (1 + actionValue / 100));

        case 'decrease_percentage':
            return Math.max(0, Math.round(basePriceCents * (1 - actionValue / 100)));

        case 'increase_fixed':
            return basePriceCents + parseInt(rule.action_value);

        case 'decrease_fixed':
            return Math.max(0, basePriceCents - parseInt(rule.action_value));

        default:
            return basePriceCents;
    }
};

export const calculateAllPrices = (products, rules) => {
    return products.map(product => ({
        ...product,
        proposed_price_cents: calculatePrice(product, rules),
    }));
};