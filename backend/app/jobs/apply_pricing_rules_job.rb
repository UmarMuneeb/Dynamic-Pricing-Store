class ApplyPricingRulesJob
  include Sidekiq::Job

  def perform
    PriceCalculatorService.apply_rules_to_all_products
  end
end
