class PricingRule
  include Mongoid::Document
  include Mongoid::Timestamps

  # Fields
  field :name, type: String
  field :conditionType, type: String
  field :conditionValue, type: String
  field :actionType, type: String
  field :actionValue, type: String
  field :priority, type: Integer, default: 1
  field :active, type: Boolean, default: true

  # Validations
  validates :name, presence: true
  validates :conditionType, presence: true, inclusion: { 
    in: %w[category_is stock_less_than stock_greater_than],
    message: "%{value} is not a valid condition type"
  }
  validates :conditionValue, presence: true
  validates :actionType, presence: true, inclusion: { 
    in: %w[increase_percentage decrease_percentage increase_fixed decrease_fixed],
    message: "%{value} is not a valid action type"
  }
  validates :actionValue, presence: true
  validates :priority, presence: true, numericality: { 
    only_integer: true, 
    greater_than: 0 
  }

  # Default scope: active rules ordered by priority
  default_scope -> { where(active: true).order_by(priority: :asc) }
end