class PricingLog
  include Mongoid::Document
  include Mongoid::Timestamps

  field :appliedAt, type: DateTime
  field :status, type: Symbol, default: :processing
  field :affectedCount, type: Integer, default: 0
  field :totalProducts, type: Integer, default: 0
  field :errorLog, type: String
  field :jobId, type: String

  # Validations
  validates :status, inclusion: { in: [:processing, :success, :failed] }

  # Indexes
  index({ appliedAt: -1 })
  index({ status: 1 })
end
