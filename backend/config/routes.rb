Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'health#index'

  # API routes will go here
  # API routes
  namespace :api do
    resources :products, only: [:index]
  end
end
