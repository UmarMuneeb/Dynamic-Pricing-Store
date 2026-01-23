class PriceCalculatorService
  def self.calculate_price(product, rules = nil)
    rules ||= PricingRule.where(active: true).order_by(priority: :asc)
    
    matching_rule = find_matching_rule(product, rules)
    
    return product.basePriceCents unless matching_rule
    
    apply_rule(product.basePriceCents, matching_rule)
  end

  # Calculate prices for all products
  def self.calculate_all_prices(products = nil, rules = nil)
    products ||= Product.all
    rules ||= PricingRule.where(active: true).order_by(priority: :asc)
    
    result = {}
    products.each do |product|
      result[product.id.to_s] = calculate_price(product, rules)
    end
    result
  end

  # Apply pricing rules to all products and update database
  def self.apply_rules_to_all_products(log_id)
    # Find the existing pricing log entry created by the controller
    pricing_log = PricingLog.find(log_id)

    begin
      products = Product.all.to_a
      rules = PricingRule.where(active: true).order_by(priority: :asc).to_a
      
      affected_count = 0
      bulk_operations = []
      
      products.each do |product|
        new_price = calculate_price(product, rules)
        
        if product.currentPriceCents != new_price
          # Prepare bulk update operation
          bulk_operations << {
            update_one: {
              filter: { _id: product.id },
              update: { '$set' => { currentPriceCents: new_price } }
            }
          }
          affected_count += 1
        end
      end
      
      
      # Execute all updates in a single bulk operation
      if bulk_operations.any?
        Product.collection.bulk_write(bulk_operations, ordered: false)
      end
      
      # Update log to success
      pricing_log.reload
      pricing_log.update!(
        status: :success,
        affectedCount: affected_count,
        totalProducts: products.count
      )
      
      {
        success: true,
        affectedCount: affected_count,
        totalProducts: products.count,
        timestamp: Time.now.utc,
        logId: pricing_log.id.to_s
      }
    rescue => e
      # Update log to failed with error details
      pricing_log.reload
      pricing_log.update!(
        status: :failed,
        errorLog: "#{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      )
      
      # Re-raise the error so it can be handled by the caller
      raise e
    end
  end

  private

  # Find the first rule that matches the product
  def self.find_matching_rule(product, rules)
    rules.find { |rule| rule_matches?(product, rule) }
  end

  # Check if a rule matches a product
  def self.rule_matches?(product, rule)
    case rule.conditionType
    when 'category_is'
      product.category == rule.conditionValue
    when 'stock_less_than'
      product.stockQuantity < rule.conditionValue.to_i
    when 'stock_greater_than'
      product.stockQuantity > rule.conditionValue.to_i
    else
      false
    end
  end

  # Apply a rule's action to a base price
  def self.apply_rule(basePriceCents, rule)
    actionValue = BigDecimal(rule.actionValue)
    
    case rule.actionType
    when 'increase_percentage'
      increase = (basePriceCents * actionValue / 100).to_i
      basePriceCents + increase
      
    when 'decrease_percentage'
      decrease = (basePriceCents * actionValue / 100).to_i
      newPrice = basePriceCents - decrease
      [newPrice, 0].max # Don't go below 0
      
    when 'increase_fixed'
      basePriceCents + actionValue.to_i
      
    when 'decrease_fixed'
      newPrice = basePriceCents - actionValue.to_i
      [newPrice, 0].max # Don't go below 0
      
    else
      basePriceCents
    end
  end
end