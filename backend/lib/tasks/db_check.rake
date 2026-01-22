namespace :db do
  desc "Check MongoDB connection status"
  task check: :environment do
    require_relative '../mongodb_health_check'
    MongodbHealthCheck.print_status
  end

  desc "Show MongoDB statistics"
  task stats: :environment do
    client = Mongoid.default_client
    db = client.database
    
    puts "MongoDB Statistics"
    puts "Database: #{db.name}"
    puts "Collections: #{db.collection_names.join(', ')}"
  end
end