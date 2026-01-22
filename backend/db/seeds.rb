# # Clear existing data
# puts "Clearing existing products..."
# Product.delete_all

# puts "Creating sample products..."

# products_data = [
#   { name: "iPhone 15 Pro", category: "Electronics", stockQuantity: 25, basePriceCents: 99900 },
#   { name: "MacBook Air M2", category: "Electronics", stockQuantity: 15, basePriceCents: 119900 },
#   { name: "Samsung 4K TV", category: "Electronics", stockQuantity: 8, basePriceCents: 79900 },
#   { name: "Sony Headphones", category: "Electronics", stockQuantity: 3, basePriceCents: 34900 },
#   { name: "iPad Air", category: "Electronics", stockQuantity: 12, basePriceCents: 59900 },
  
#   { name: "Nike Running Shoes", category: "Clothing", stockQuantity: 30, basePriceCents: 12999 },
#   { name: "Levi's Jeans", category: "Clothing", stockQuantity: 45, basePriceCents: 6999 },
#   { name: "North Face Jacket", category: "Clothing", stockQuantity: 7, basePriceCents: 24999 },
#   { name: "Adidas T-Shirt", category: "Clothing", stockQuantity: 60, basePriceCents: 2999 },
  
#   { name: "Dyson Vacuum", category: "Home & Garden", stockQuantity: 5, basePriceCents: 49900 },
#   { name: "KitchenAid Mixer", category: "Home & Garden", stockQuantity: 18, basePriceCents: 37999 },
#   { name: "Garden Tool Set", category: "Home & Garden", stockQuantity: 22, basePriceCents: 8999 },
  
#   { name: "The Pragmatic Programmer", category: "Books", stockQuantity: 50, basePriceCents: 4999 },
#   { name: "Clean Code", category: "Books", stockQuantity: 35, basePriceCents: 4299 },
#   { name: "Design Patterns", category: "Books", stockQuantity: 2, basePriceCents: 5499 }
# ]

# products_data.each do |product_attrs|
#   product = Product.create!(product_attrs)
#   puts "Created: #{product.name} - $#{product.basePriceCents / 100.0} (Stock: #{product.stockQuantity})"
# end

# puts "\n#{Product.count} products created successfully"

# puts "\nProducts by category:"
# Product.collection.aggregate([
#   { '$group' => { _id: '$category', count: { '$sum' => 1 } } }
# ]).each do |result|
#   puts "  #{result['_id']}: #{result['count']} products"
# end


puts "Creating sample pricing rules..."

PricingRule.delete_all

rules_data = [
  {
    name: "Low Stock Premium",
    conditionType: "stock_less_than",
    conditionValue: "10",
    actionType: "increase_percentage",
    actionValue: "15",
    priority: 1,
    active: true
  },
  {
    name: "Electronics Discount",
    conditionType: "category_is",
    conditionValue: "Electronics",
    actionType: "decrease_percentage",
    actionValue: "10",
    priority: 2,
    active: true
  },
  {
    name: "High Stock Clearance",
    conditionType: "stock_greater_than",
    conditionValue: "40",
    actionType: "decrease_fixed",
    actionValue: "500",
    priority: 3,
    active: true
  }
]

rules_data.each do |rule_attrs|
  rule = PricingRule.create!(rule_attrs)
  puts "Created rule: #{rule.name} (Priority: #{rule.priority})"
end

puts "\n#{PricingRule.count} pricing rules created successfully!"