Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'health#index'

  # API routes will go here
  namespace :api do
    namespace :v1 do
      # Future routes
    end
  end
end
