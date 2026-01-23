class Api::PricingLogsController < ApplicationController
  # GET /api/pricing_logs
  def index
    # Fetch last 50 logs, ordered by most recent
    logs = PricingLog.order(appliedAt: :desc).limit(50)
    
    render json: logs.map { |log|
      {
        id: log.id.to_s,
        status: log.status,
        appliedAt: log.appliedAt,
        affectedCount: log.affectedCount,
        totalProducts: log.totalProducts,
        errorLog: log.errorLog
      }
    }
  end

  # GET /api/pricing_logs/:id
  def show
    pricing_log = PricingLog.find(params[:id])
    
    render json: {
      id: pricing_log.id.to_s,
      status: pricing_log.status,
      appliedAt: pricing_log.appliedAt,
      affectedCount: pricing_log.affectedCount,
      totalProducts: pricing_log.totalProducts,
      errorLog: pricing_log.errorLog
    }
  rescue Mongoid::Errors::DocumentNotFound
    render json: { error: 'Pricing log not found' }, status: :not_found
  end
end
