Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'health#index'

  # API routes will go here
  # API routes
  namespace :api do
    resources :products, only: [:index]
    resources :pricing_rules do
      post 'apply', on: :collection
    end
    resources :pricing_logs, only: [:index, :show]
    get 'price_preview', to: 'price_previews#index'
  end
end
