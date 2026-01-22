# frozen_string_literal: true

module MongodbHealthCheck
  def self.check
    begin
      client = Mongoid.default_client
      result = client.database.command(ping: 1)
      
      if result.first['ok'] == 1
        {
          status: 'connected',
          database: client.database.name,
          message: 'MongoDB is connected and healthy'
        }
      else
        {
          status: 'error',
          message: 'MongoDB connection failed'
        }
      end
    rescue => e
      {
        status: 'error',
        message: "MongoDB error: #{e.message}"
      }
    end
  end

  def self.print_status
    result = check
    puts "MongoDB Health Check"
    puts "Status: #{result[:status]}"
    puts "Database: #{result[:database]}" if result[:database]
    puts result[:message]
  end
end