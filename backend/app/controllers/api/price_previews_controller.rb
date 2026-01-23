
class Api::PricePreviewsController < ApplicationController
    def index
      products = Product.all
      rules = PricingRule.where(active: true)
      
      calculated_prices = PriceCalculatorService.calculate_all_prices(products, rules)
      
      result = products.map do |product|
        calculated_price = calculated_prices[product.id.to_s]
        
        {
          id: product.id.to_s,
          name: product.name,
          category: product.category,
          stockQuantity: product.stockQuantity,
          basePriceCents: product.basePriceCents,
          currentPriceCents: product.currentPriceCents,
          proposedPriceCents: calculated_price,
          priceChanged: calculated_price != product.basePriceCents,
          priceDifferenceCents: calculated_price - product.basePriceCents
        }
      end
      
      render json: result
    end
end