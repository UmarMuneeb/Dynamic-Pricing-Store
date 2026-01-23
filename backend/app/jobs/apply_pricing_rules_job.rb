class ApplyPricingRulesJob
  include Sidekiq::Job

  def perform(log_id)
    PriceCalculatorService.apply_rules_to_all_products(log_id)
  end
end
