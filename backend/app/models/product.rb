class Product
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String
  field :category, type: String
  field :stockQuantity, type: Integer, default: 0
  field :basePriceCents, type: Integer
  field :currentPriceCents, type: Integer

  validates :name, presence: true
  validates :category, presence: true
  validates :stockQuantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :basePriceCents, numericality: { only_integer: true, greater_than: 0 }
  validates :currentPriceCents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }



  # Indexes for better query performance
  index({ category: 1 })
  index({ stockQuantity: 1 })
  index({ name: 1 })

  # Callbacks
  before_validation :set_current_price
  after_initialize :set_current_price

  # Helper methods for price conversion
  def base_price
    BigDecimal(basePriceCents) / 100
  end

  def base_price=(dollars)
    self.basePriceCents = (BigDecimal(dollars.to_s) * 100).to_i
  end

  def current_price
    BigDecimal(currentPriceCents) / 100
  end

  def current_price=(dollars)
    self.currentPriceCents = (BigDecimal(dollars.to_s) * 100).to_i
  end

  # Check if price has changed from base
  def price_changed?
    currentPriceCents != basePriceCents
  end

  def price_difference_cents
    currentPriceCents - basePriceCents
  end

  def price_difference_percentage
    return 0 if basePriceCents.zero?
    ((price_difference_cents.to_f / basePriceCents) * 100).round(2)
  end

  # Stock status helpers
  def low_stock?
    stockQuantity < 10
  end

  def out_of_stock?
    stockQuantity.zero?
  end

  def in_stock?
    stockQuantity > 0
  end

  private

  def set_current_price
    self.currentPriceCents ||= basePriceCents
  end
end