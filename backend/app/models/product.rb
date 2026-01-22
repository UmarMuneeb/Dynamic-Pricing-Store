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



  before_validation :setCurrentPriceCents, on: :create

  private

  def setCurrentPriceCents
    self.currentPriceCents ||= basePriceCents
  end
end