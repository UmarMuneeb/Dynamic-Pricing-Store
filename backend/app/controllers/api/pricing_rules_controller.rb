
class Api::PricingRulesController < ApplicationController
  def index
    rules = PricingRule.unscoped.order_by(priority: :asc)
    
    render json: rules.map { |r| serialize_rule(r) }
  end
  def create
    rule = PricingRule.new(rule_params)
    
    if rule.save
      render json: serialize_rule(rule), status: :created
    else
      render json: { errors: rule.errors.full_messages }, status: :unprocessable_entity
    end
  end
  def update
    rule = PricingRule.unscoped.find(params[:id])
    
    if rule.update(rule_params)
      render json: serialize_rule(rule)
    else
      render json: { errors: rule.errors.full_messages }, status: :unprocessable_entity
    end
  end
  def destroy
    rule = PricingRule.unscoped.find(params[:id])
    rule.destroy
    
    head :no_content
  end

  def apply
    # Create a pricing log entry before enqueuing the job
    pricing_log = PricingLog.create!(
      appliedAt: Time.now.utc,
      status: :processing
    )
    
    # Store the log_id in the job for tracking
    ApplyPricingRulesJob.perform_async(pricing_log.id.to_s)
    
    render json: {
      success: true,
      message: "Pricing rules are being applied in the background",
      status: "processing",
      logId: pricing_log.id.to_s
    }
  rescue => e
    render json: {
      success: false,
      message: "Failed to enqueue pricing rules job: #{e.message}"
    }, status: :internal_server_error
  end

  private
  def serialize_rule(rule)
    {
      id: rule.id.to_s,
      name: rule.name,
      conditionType: rule.conditionType,
      conditionValue: rule.conditionValue,
      actionType: rule.actionType,
      actionValue: rule.actionValue,
      priority: rule.priority,
      active: rule.active,
      created_at: rule.created_at,
      updated_at: rule.updated_at
    }
  end
  def rule_params
    params.require(:pricing_rule).permit(
      :name,
      :conditionType,
      :conditionValue,
      :actionType,
      :actionValue,
      :priority,
      :active
    )
  end
end