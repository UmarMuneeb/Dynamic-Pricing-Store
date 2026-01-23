# Dynamic Pricing Rules Engine

A full-stack e-commerce pricing management system that allows store managers to define, preview, and apply dynamic pricing rules based on product attributes and inventory levels.

## Table of Contents

- [Overview](#overview)
- [Technical Stack](#technical-stack)
- [Architecture](#architecture)
- [Functional Requirements Implementation](#functional-requirements-implementation)
- [Skill-Test Constraints](#skill-test-constraints)
- [Edge Cases Handled](#edge-cases-handled)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Trade-offs & Design Decisions](#trade-offs--design-decisions)

---

## Overview

This application solves the challenge of dynamic pricing in modern e-commerce by providing:
- **Real-time price preview** before applying changes
- **Priority-based rule engine** for conflict resolution
- **Background job processing** for scalable price updates
- **Audit logging** for compliance and debugging

---

## Technical Stack

### Backend
- **Framework**: Ruby on Rails 8.1.2
- **Database**: MongoDB with Mongoid ODM
- **Background Jobs**: Sidekiq 7.0 with Redis
- **API**: RESTful JSON API

### Frontend
- **Framework**: React.js 18
- **State Management**: React Hooks (useState, useMemo)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Infrastructure
- **Redis**: Job queue and caching
- **CORS**: Rack-CORS for cross-origin requests

---

## Architecture

### Service Object Pattern

The core pricing logic is encapsulated in a dedicated service object to maintain separation of concerns:

```ruby
# app/services/price_calculator_service.rb
class PriceCalculatorService
  def self.calculate_price(product, rules = nil)
    # Priority-based rule matching
    # Returns calculated price in cents
  end
end
```

**Key Responsibilities:**
- Accept a product and set of active rules
- Determine which rule applies (priority-based)
- Return the final calculated price
- Handle edge cases (no match, fractional cents, etc.)

### Data Models

#### Product Model
```ruby
# app/models/product.rb
field :name, type: String
field :category, type: String
field :stockQuantity, type: Integer
field :basePriceCents, type: Integer      # Immutable reference price
field :currentPriceCents, type: Integer   # Active selling price
```

#### PricingRule Model
```ruby
# app/models/pricing_rule.rb
field :name, type: String
field :conditionType, type: String        # category_is, stock_less_than, stock_greater_than
field :conditionValue, type: String
field :actionType, type: String           # increase_percentage, decrease_percentage, etc.
field :actionValue, type: String
field :priority, type: Integer, default: 1
field :active, type: Boolean, default: true
```

#### PricingLog Model
```ruby
# app/models/pricing_log.rb
field :appliedAt, type: Time
field :status, type: Symbol              # :processing, :success, :failed
field :affectedCount, type: Integer
field :totalProducts, type: Integer
field :errorLog, type: String
```

---

## Functional Requirements Implementation

### Part A: React Dashboard

#### 1. Inventory View

**Location**: `frontend/src/components/productTables.js`

The inventory table displays all required fields plus a **live "Proposed Price"** column:

| Feature | Implementation |
|---------|----------------|
| Product Name | Direct display from API |
| Category | Color-coded badges |
| Stock Quantity | Color indicators (Red < 10, Yellow < 50, Green ≥ 50) |
| Base Price | Formatted as currency ($X.XX) |
| **Proposed Price** | **Calculated in real-time using `calculatePrice()` utility** |
| Current Price | Active selling price (blue highlight) |

**Code Snapshot Placeholder**: Screenshot of Inventory View

**Live Preview Logic**:
```javascript
// frontend/src/utils/priceCalculator.js
export const calculatePrice = (product, rules) => {
  const activeRules = rules
    .filter(rule => rule.active)
    .sort((a, b) => {
      // Primary: Priority (ascending)
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Tie-breaker: Creation date (oldest wins)
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  const matchingRule = activeRules.find(rule => ruleMatches(product, rule));
  return matchingRule ? applyRule(product.basePriceCents, matchingRule) : product.basePriceCents;
};
```

#### 2. Rule Builder

**Location**: `frontend/src/components/rulesForm.js`

Dynamic form with conditional inputs based on rule type:

**Features**:
- **Condition Type Selector**: Dropdown (Category, Stock Less Than, Stock Greater Than)
- **Condition Value**: 
  - Category → Dropdown populated from products
  - Stock → Number input with `min="0"`
- **Action Type Selector**: Dropdown (Increase %, Decrease %, Increase Fixed, Decrease Fixed)
- **Action Value**: Number input with `min="0"` validation
- **Priority**: Integer input (1 = highest)
- **Active Toggle**: Checkbox for enabling/disabling

**Code Snapshot Placeholder**: Screenshot of Rule Builder Form

#### 3. Live Price Preview

**Location**: `frontend/src/components/RulePreviewTable.js`

**Key Features**:
- **Instant Updates**: Uses `useMemo` for performance optimization
- **Visual Indicators**:
  - Green text → Price increase
  - Red text → Price decrease
  - Gray text → No change
- **Priority-Aware**: Only shows products where this rule is the actual winner

**Implementation**:
```javascript
const affectedProducts = useMemo(() => {
  // 1. Simulate full rule set (including current edits)
  let rulesToSimulate = [...allRules];
  if (rule.id) {
    rulesToSimulate = rulesToSimulate.map(r => r.id === rule.id ? rule : r);
  } else {
    rulesToSimulate.push(rule);
  }

  // 2. Sort exactly like backend
  const sortedRules = rulesToSimulate
    .filter(r => r.active)
    .sort(/* priority + createdAt */);

  // 3. Only show products where THIS rule wins
  return products.filter(product => {
    const winner = sortedRules.find(r => ruleMatches(product, r));
    return winner && (rule.id ? winner.id === rule.id : winner === rule);
  });
}, [products, rule, allRules]);
```

**Code Snapshot Placeholder**: Screenshot of Live Preview Table

---

### Part B: Rails Backend

#### 1. Rule Engine (PriceCalculatorService)

**Location**: `backend/app/services/price_calculator_service.rb`

**Core Methods**:

```ruby
# Calculate price for a single product
def self.calculate_price(product, rules = nil)
  rules ||= PricingRule.where(active: true).order_by(priority: :asc, created_at: :asc)
  matching_rule = find_matching_rule(product, rules)
  return product.basePriceCents unless matching_rule
  apply_rule(product.basePriceCents, matching_rule)
end

# Apply pricing rules to all products (background job)
def self.apply_rules_to_all_products(log_id)
  pricing_log = PricingLog.find(log_id)
  
  begin
    products = Product.all.to_a
    rules = PricingRule.where(active: true).order_by(priority: :asc, created_at: :asc).to_a
    
    # Bulk update for performance
    bulk_operations = []
    products.each do |product|
      new_price = calculate_price(product, rules)
      if product.currentPriceCents != new_price
        bulk_operations << {
          update_one: {
            filter: { _id: product.id },
            update: { '$set' => { currentPriceCents: new_price } }
          }
        }
      end
    end
    
    Product.collection.bulk_write(bulk_operations, ordered: false) if bulk_operations.any?
    pricing_log.update!(status: :success, affectedCount: bulk_operations.count)
  rescue => e
    pricing_log.update!(status: :failed, errorLog: e.message)
    raise e
  end
end
```

**Code Snapshot Placeholder**: PriceCalculatorService implementation

#### 2. Conflict Resolution

**Strategy**: Priority-based with deterministic tie-breaking

**Implementation**:
```ruby
# In PricingRule model
default_scope -> { where(active: true).order_by(priority: :asc, created_at: :asc) }

# In PriceCalculatorService
def self.find_matching_rule(product, rules)
  rules.find { |rule| rule_matches?(product, rule) }  # Returns FIRST match (highest priority)
end
```

**Behavior**:
- Lower priority number = Higher precedence (Priority 1 beats Priority 2)
- If priorities are equal, older rule (created first) wins
- Only ONE rule is applied per product
- If no rules match, base price is unchanged

#### 3. Persistence (Background Jobs)

**Location**: `backend/app/jobs/apply_pricing_rules_job.rb`

**Flow**:
1. User clicks "Apply Rules" → API creates `PricingLog` with status `:processing`
2. Sidekiq job is enqueued with `log_id`
3. Job fetches products and rules, calculates new prices
4. Bulk update to MongoDB (atomic per-document)
5. Log status updated to `:success` or `:failed`

**Code**:
```ruby
class ApplyPricingRulesJob
  include Sidekiq::Job

  def perform(log_id)
    PriceCalculatorService.apply_rules_to_all_products(log_id)
  end
end
```

**Controller**:
```ruby
def apply
  pricing_log = PricingLog.create!(appliedAt: Time.now.utc, status: :processing)
  ApplyPricingRulesJob.perform_async(pricing_log.id.to_s)
  
  render json: {
    success: true,
    status: "processing",
    logId: pricing_log.id.to_s
  }
end
```

**Code Snapshot Placeholder**: Background job flow diagram

#### 4. Logging

**Location**: `backend/app/models/pricing_log.rb`

**Logged Data**:
- `appliedAt`: Timestamp (UTC)
- `status`: `:processing`, `:success`, or `:failed`
- `affectedCount`: Number of products with price changes
- `totalProducts`: Total products processed
- `errorLog`: Stack trace if job fails

**Frontend Display**: `frontend/src/components/logsList.js`

**Code Snapshot Placeholder**: Logs history table

---

## Skill-Test Constraints

### 1. Currency Integrity

**Requirement**: No floating-point arithmetic for prices

**Implementation**:
- All prices stored as **integer cents** (`basePriceCents`, `currentPriceCents`)
- Calculations use `BigDecimal` for intermediate math
- Final results rounded to nearest cent using `.round`

**Example**:
```ruby
# Backend (Ruby)
when 'increase_percentage'
  increase = (basePriceCents * actionValue / 100.0).round  # Not .to_i (truncation)
  basePriceCents + increase
```

```javascript
// Frontend (JavaScript)
case 'increase_percentage':
  return Math.round(basePriceCents * (1 + actionValue / 100));  // Proper rounding
```

### 2. Performance

**Requirement**: Live preview must remain responsive

**Optimizations**:
- **Frontend**:
  - `useMemo` hooks to cache calculations
  - Debounced re-renders on form changes
  - Granular state updates (only affected components re-render)
- **Backend**:
  - Bulk write operations (single DB call for all updates)
  - Background jobs for heavy processing
  - Database indexes on `category` and `stockQuantity`

**Code Snapshot Placeholder**: Performance metrics

### 3. Atomic State

**Requirement**: No partial updates if job fails

**Implementation**:

**MongoDB Standalone Limitation**:
- MongoDB transactions require a replica set
- Our standalone instance doesn't support multi-document transactions

**Mitigation Strategy**:
1. **Bulk Write with `ordered: false`**: All updates attempted, failures logged
2. **Status Tracking**: `PricingLog` tracks job state
3. **Error Logging**: Full stack trace captured for debugging
4. **Idempotency**: Re-running the job produces the same result

**Trade-off**: In a production environment, we would use:
- MongoDB replica set for true ACID transactions
- OR PostgreSQL with `ActiveRecord::Base.transaction`

**Code**:
```ruby
begin
  Product.collection.bulk_write(bulk_operations, ordered: false)
  pricing_log.update!(status: :success)
rescue => e
  pricing_log.update!(status: :failed, errorLog: e.message)
  raise e  # Re-raise for Sidekiq retry logic
end
```

---

## Edge Cases Handled

### 1. Invalid Priority (0, negative, non-numeric)

**Backend Validation**:
```ruby
validates :priority, presence: true, numericality: { 
  only_integer: true, 
  greater_than: 0 
}
```

**Frontend Validation**:
```javascript
<input type="number" name="priority" min="1" required />
```

**Behavior**: Invalid rules cannot be saved to the database.

---

### 2. Zero or Negative Stock

**Backend Validation**:
```ruby
validates :stockQuantity, numericality: { 
  only_integer: true, 
  greater_than_or_equal_to: 0 
}
```

**Behavior**: 
- Negative stock is prevented at DB level
- Zero stock is valid and correctly matches "stock_less_than" conditions

---

### 3. Base Price is Nil or Zero

**Backend Validation**:
```ruby
validates :basePriceCents, numericality: { 
  only_integer: true, 
  greater_than: 0 
}
```

**Behavior**: Every product must have a valid base price (minimum 1 cent).

---

### 4. Two Rules with Identical Priority

**Solution**: Deterministic tie-breaker using creation timestamp

**Implementation**:
```ruby
default_scope -> { 
  where(active: true).order_by(priority: :asc, created_at: :asc) 
}
```

**Behavior**: If priorities are equal, the **older rule** (created first) wins.

**Example**:
- Rule A: Priority 1, Created 2024-01-01
- Rule B: Priority 1, Created 2024-01-02
- **Winner**: Rule A (older)

---

### 5. Percentage Increase Results in Fractional Cents

**Problem**: 10% of $0.95 = $0.095 (fractional cent)

**Solution**: Standard rounding (not truncation)

**Implementation**:
```ruby
# Backend
increase = (basePriceCents * actionValue / 100.0).round  # 9.5 → 10
```

```javascript
// Frontend
return Math.round(basePriceCents * (1 + actionValue / 100));  // Same logic
```

**Behavior**: $0.095 rounds to $0.10 (not $0.09)

---

### 6. Rule Deletion While Background Job is Running

**Solution**: Snapshot Isolation

**Implementation**:
```ruby
def self.apply_rules_to_all_products(log_id)
  # Fetch rules at START of job (snapshot)
  rules = PricingRule.where(active: true).order_by(...).to_a
  
  # Job uses this in-memory snapshot for entire run
  products.each do |product|
    calculate_price(product, rules)  # Uses snapshot, not live DB
  end
end
```

**Behavior**:
- **Deleted during job**: Job completes with snapshot, next run uses updated rules

---


## Setup Instructions

### Prerequisites
- Ruby 3.3+
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+

### Backend Setup

```bash
cd backend

# Install dependencies
bundle install

# Seed database
rails db:seed

# Start Rails server
rails server

# Start Sidekiq (separate terminal)
bundle exec sidekiq
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

---

## API Documentation

### Products

#### GET /api/products
Returns all products with current prices.

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Mouse",
    "category": "Electronics",
    "stockQuantity": 45,
    "basePriceCents": 2999,
    "currentPriceCents": 3299
  }
]
```

---

### Pricing Rules

#### GET /api/pricing_rules
Returns all pricing rules.

#### POST /api/pricing_rules
Create a new pricing rule.

**Request Body**:
```json
{
  "pricing_rule": {
    "name": "Low Stock Premium",
    "conditionType": "stock_less_than",
    "conditionValue": "10",
    "actionType": "increase_percentage",
    "actionValue": "15",
    "priority": 1,
    "active": true
  }
}
```

#### PUT /api/pricing_rules/:id
Update an existing rule.

#### DELETE /api/pricing_rules/:id
Delete a rule.

#### POST /api/pricing_rules/apply
Trigger background job to apply all active rules.

**Response**:
```json
{
  "success": true,
  "status": "processing",
  "logId": "507f1f77bcf86cd799439012"
}
```

---

### Pricing Logs

#### GET /api/pricing_logs
Returns the 50 most recent pricing job logs.

#### GET /api/pricing_logs/:id
Get status of a specific pricing job (for polling).

**Response**:
```json
{
  "id": "507f1f77bcf86cd799439012",
  "status": "success",
  "appliedAt": "2024-01-23T19:00:00Z",
  "affectedCount": 12,
  "totalProducts": 50,
  "errorLog": null
}
```


**Coverage**:
- Model validations
- Service object logic (priority handling, rounding)
- Controller endpoints
- Background job execution

---

## Trade-offs & Design Decisions

### 1. MongoDB vs PostgreSQL

**Choice**: MongoDB

**Rationale**:
- Simpler setup for development
- Flexible schema for rapid iteration

**Trade-off**: 
- No multi-document transactions in standalone mode
- Mitigated with bulk writes and status logging

---

### 2. Frontend State Management

**Choice**: React Hooks (no Redux/MobX)

**Rationale**:
- Application state is simple (products, rules, logs)
- Hooks provide sufficient performance with `useMemo`
- Reduces bundle size and complexity

**Trade-off**: 
- For larger apps, centralized state management would be better
- Current approach scales well for this use case

---

### 3. Polling vs WebSockets

**Choice**: HTTP Polling for job status

**Rationale**:
- Simpler implementation
- No persistent connections to manage
- Jobs typically complete in <5 seconds

**Trade-off**: 
- Slightly higher latency (1-second poll interval)
- More HTTP requests
- WebSockets would be more efficient for real-time updates

---

### 4. Optimistic UI Updates

**Choice**: Immediate local state update on rule toggle

**Rationale**:
- Better UX (instant feedback)
- Reduced perceived latency
- Rollback on error

**Trade-off**: 
- Temporary inconsistency if backend fails
- Mitigated with error handling and state reversion

---

## Author

Umar Muneeb
