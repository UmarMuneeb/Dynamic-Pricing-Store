namespace :mongodb do
  desc "Create MongoDB indexes"
  task create_indexes: :environment do
    puts "Creating MongoDB indexes..."
    
    Product.create_indexes
    
    puts "indexes created successfully!"
    puts "\nProduct indexes:"
    Product.index_specifications.each do |spec|
      puts "  - #{spec.key}"
    end
  end

  desc "Remove all MongoDB indexes"
  task remove_indexes: :environment do
    puts "Removing MongoDB indexes..."
    Product.remove_indexes
    puts "indexes removed successfully"
  end
end