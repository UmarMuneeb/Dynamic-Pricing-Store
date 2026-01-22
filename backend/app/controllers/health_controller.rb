class HealthController < ApplicationController
  def index
    render json: {
      status: 'ok',
      timestamp: Time.current,
      database: database_status,
      redis: redis_status
    }
  end

  private

  def database_status
    Mongoid.default_client.database.command(ping: 1)
    { connected: true, name: Mongoid.default_client.database.name }
  rescue => e
    { connected: false, error: e.message }
  end

  def redis_status
    Sidekiq.redis(&:ping)
    { connected: true }
  rescue => e
    { connected: false, error: e.message }
  end
end