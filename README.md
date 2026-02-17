# AI-Powered Food Ordering System

An intelligent conversational food ordering platform with AI-powered recommendations, built with React, TypeScript, Node.js, and MongoDB.

## Quick Start (Docker Compose)

### 1. Create Environment Files

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Run with Docker Compose

```bash
docker compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5200

### 3. Stop the Application

```bash
docker compose down
```

---

## Technical Requirements Document (TRD)

### 1. System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        Web["Web App<br/>React + Vite"]
    end
    
    subgraph Proxy["🔀 Proxy Layer"]
        Nginx["Nginx<br/>Static Files + Reverse Proxy"]
    end
    
    subgraph API["⚙️ API Layer (Node.js/Express)"]
        Express["Express Server"]
        
        subgraph Routes["Route Handlers"]
            AuthR["Auth Routes<br/>/api/auth"]
            CartR["Cart Routes<br/>/api/cart"]
            OrderR["Order Routes<br/>/api/orders"]
            SearchR["Search Routes<br/>/api/search"]
            FoodsR["Foods Routes<br/>/api/foods"]
        end
        
        subgraph Services["Service Layer"]
            AuthSvc["Auth Service"]
            CartSvc["Cart Service"]
            OrderSvc["Order Service"]
            SearchSvc["Search Service"]
            IntentSvc["Intent Service"]
            RetrievalSvc["Retrieval Service"]
            GeminiSvc["Gemini Service"]
            SessionSvc["Session Service"]
            DataSvc["Data Service"]
            EmbedSvc["Embedding Service"]
        end
    end
    
    subgraph Data["💾 Data Layer"]
        MongoDB[("MongoDB<br/>Database")]
        Embeddings[("Embeddings<br/>JSON File")]
    end
    
    subgraph External["🌐 External Services"]
        GeminiAPI["Google Gemini API<br/>Embeddings + Intent"]
        CDN["Image CDN<br/>ImageKit"]
    end
    
    Web --> Nginx
    Nginx --> Express
    Express --> Routes
    
    AuthR --> AuthSvc
    CartR --> CartSvc
    OrderR --> OrderSvc
    SearchR --> SearchSvc
    FoodsR --> DataSvc
    
    SearchSvc --> IntentSvc
    SearchSvc --> RetrievalSvc
    IntentSvc --> GeminiSvc
    RetrievalSvc --> GeminiSvc
    RetrievalSvc --> EmbedSvc
    GeminiSvc --> GeminiAPI
    
    AuthSvc --> MongoDB
    CartSvc --> MongoDB
    OrderSvc --> MongoDB
    SessionSvc --> MongoDB
    DataSvc --> MongoDB
    EmbedSvc --> Embeddings
    
    Web -.-> CDN
```

### 2. Database Schema (MongoDB)

#### Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **users** | Registered user accounts | `_id`, `email`, `password_hash`, `name`, `phone`, `created_at` |
| **sessions** | Conversation sessions | `_id`, `user_id` (nullable), `created_at`, `last_message_at`, `metadata` |
| **messages** | Chat history | `_id`, `session_id`, `role`, `content`, `intent`, `filters`, `results`, `timestamp` |
| **session_contexts** | Conversation state | `session_id`, `last_mentioned_items`, `last_search_query`, `preferences`, `cart_id`, `updated_at` |
| **carts** | Shopping carts | `_id`, `session_id`, `user_id`, `items[]`, `created_at`, `updated_at` |
| **orders** | Completed orders | `_id`, `user_id`, `session_id`, `cart_snapshot`, `customer_info`, `total`, `status`, `payment_method`, `created_at` |

#### Schema Relationships

```mermaid
flowchart TB
    subgraph Collections["📦 MongoDB Collections"]
        U["👤 users<br/>_id, email, password_hash, name, phone"]
        S["💬 sessions<br/>_id, user_id, created_at, metadata"]
        M["📝 messages<br/>session_id, role, content, intent, timestamp"]
        SC["🎯 session_contexts<br/>session_id, preferences, last_mentioned_items"]
        C["🛒 carts<br/>session_id, user_id, items[], total"]
        O["📋 orders<br/>user_id, session_id, cart_snapshot, status"]
    end
    
    U -->|"has many"| S
    U -->|"owns"| C
    U -->|"places"| O
    S -->|"contains"| M
    S -->|"has one"| SC
    S -->|"has one"| C
    
    style U fill:#e3f2fd,stroke:#333,stroke-width:2px
    style S fill:#f3e5f5,stroke:#333,stroke-width:2px
    style C fill:#e8f5e9,stroke:#333,stroke-width:2px
    style O fill:#fff3e0,stroke:#333,stroke-width:2px
```

#### Indexes

```javascript
// Performance indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.sessions.createIndex({ user_id: 1 });
db.messages.createIndex({ session_id: 1, timestamp: -1 });
db.carts.createIndex({ session_id: 1 });
db.carts.createIndex({ user_id: 1 });
db.orders.createIndex({ user_id: 1, created_at: -1 });
```

### 3. AI/ML Architecture

#### 3.1 Intent Extraction Flow

```mermaid
flowchart LR
    A(["👤 User Input<br/>'I want spicy vegetarian curries under ₹500'"]) --> B
    
    subgraph Step1["📋 Step 1: Context Assembly"]
        B["Load Conversation History<br/>Last 5 messages + Current input"]
    end
    
    B --> C
    
    subgraph Step2["🤖 Step 2: Gemini API Call"]
        C["Gemini 2.0 Flash<br/>Extract intent & filters"]
    end
    
    C --> D
    
    subgraph Step3["📄 Step 3: Intent Parsing"]
        D["JSON Output<br/>intent: recommend<br/>filters: {...}<br/>semantic_query: ..."]
    end
    
    D --> E
    
    subgraph Step4["⚙️ Step 4: Filter Normalization"]
        E["Map to structured filters<br/>spiceLevel → numeric<br/>budget → maxPrice<br/>protein_level → protein_min"]
    end
    
    E --> F
    
    subgraph Step5["🎯 Step 5: Reference Resolution"]
        F["Resolve 'that', 'it'<br/>→ specific food items"]
    end
    
    F --> G(["✅ Structured Query<br/>Ready for Search"])
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#9f9,stroke:#333,stroke-width:2px
```

#### 3.2 Hybrid Search Algorithm

```mermaid
flowchart LR
    A(["🔍 Query<br/>'spicy chicken dishes'"]) --> B
    
    subgraph Step1["1️⃣ Generate Embedding"]
        B["Gemini Embedding-001<br/>768-dim vector"]
    end
    
    B --> C
    
    subgraph Step2["2️⃣ Structured Filtering"]
        C["Apply Filters<br/>category = 'chicken'<br/>spiceLevel = 'high'<br/>type = 'Non-Vegetarian'"]
    end
    
    C --> D
    
    subgraph Step3["3️⃣ Semantic Scoring"]
        D["Cosine Similarity<br/>query_embedding ↔ food_embedding"]
    end
    
    D --> E
    
    subgraph Step4["4️⃣ Combined Scoring"]
        E["Final Score =<br/>(semantic × 0.7) +<br/>(keyword × 0.3)"]
    end
    
    E --> F
    
    subgraph Step5["5️⃣ Ranking"]
        F["Sort DESC<br/>Return Top K = 5"]
    end
    
    F --> G(["📊 Results<br/>Ranked Food Items"])
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#9f9,stroke:#333,stroke-width:2px
```

#### 3.3 AI Models Configuration

| Model | Purpose | Parameters |
|-------|---------|------------|
| **gemini-embedding-001** | Text embeddings | 768 dimensions |
| **gemini-2.0-flash** | Intent extraction | Temperature: 0.1, Max tokens: 1024 |

### 4. API Design

#### 4.1 RESTful Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/foods` | GET | No | Get all foods |
| `/api/foods/:id` | GET | No | Get food by ID |
| `/api/search` | POST | No | AI chat/search |
| `/api/search/:sessionId/history` | GET | No | Chat history |
| `/api/cart` | GET | No | Get cart |
| `/api/cart/items` | POST | No | Add to cart |
| `/api/cart/items/:id` | PUT | No | Update quantity |
| `/api/cart/items/:id` | DELETE | No | Remove item |
| `/api/cart` | DELETE | No | Clear cart |
| `/api/orders` | GET | Yes | Order history |
| `/api/orders` | POST | Yes | Create order |
| `/api/orders/:id` | GET | Yes | Order details |
| `/api/orders/:id/cancel` | POST | Yes | Cancel order |

#### 4.2 Request/Response Examples

**Search/Chat:**
```http
POST /api/search
Content-Type: application/json

{
  "message": "Show me spicy vegetarian curries",
  "sessionId": "optional-existing-session-id"
}

Response:
{
  "response": "Here are some spicy vegetarian curries!",
  "foods": [...],
  "sessionId": "sess_abc123",
  "intent": "recommend",
  "filters": { "vegetarian": true, "spiceLevel": "high" }
}
```

**Add to Cart:**
```http
POST /api/cart/items
Content-Type: application/json
Cookie: session_id=sess_abc123

{
  "foodId": "food_123",
  "quantity": 2
}

Response:
{
  "cart": {
    "id": "cart_456",
    "items": [...],
    "total": 798
  }
}
```

### 5. Frontend Architecture

#### 5.1 Component Hierarchy

```mermaid
flowchart TD
    App["🚀 App.tsx"] --> Router["🌐 BrowserRouter"]
    Router --> Routes["📍 Routes"]
    
    Routes --> ChatRoute["💬 / Chat"]
    Routes --> BrowseRoute["🔍 /browse"]
    Routes --> CheckoutRoute["🛒 /checkout"]
    Routes --> OrdersRoute["📋 /orders"]
    Routes --> LoginRoute["🔑 /login"]
    Routes --> SignupRoute["📝 /signup"]
    
    ChatRoute --> ChatHeader["Header"]
    ChatRoute --> ChatInterface["Chat Interface"]
    ChatRoute --> CartSidebar["CartSidebar"]
    
    ChatHeader --> Logo["Logo"]
    ChatHeader --> Nav["Navigation"]
    ChatHeader --> CartBtn["CartButton"]
    
    ChatInterface --> ChatMessages["ChatMessage[]"]
    ChatInterface --> ChatInput["ChatInput"]
    
    ChatMessages --> TextMsg["TextMessage"]
    ChatMessages --> FoodGrid["FoodCardGrid"]
    ChatMessages --> CartSummary["CartSummary"]
    
    FoodGrid --> FoodCard["FoodCard[]"]
    CartSidebar --> CartItem["CartItem[]"]
    CartSidebar --> CheckoutBtn["CheckoutButton"]
    
    BrowseRoute --> BrowseHeader["Header"]
    BrowseRoute --> BrowseGrid["FoodCardGrid"]
    
    CheckoutRoute --> CheckoutForm["CheckoutForm<br/>Formik"]
    CheckoutRoute --> OrderSummary["OrderSummary"]
    
    OrdersRoute --> OrderCard["OrderCard[]"]
    LoginRoute --> LoginForm["LoginForm<br/>Formik"]
    SignupRoute --> SignupForm["SignupForm<br/>Formik"]
    
    App --> Providers["⚙️ Providers"]
    Providers --> QueryClient["QueryClientProvider<br/>TanStack Query"]
    Providers --> Theme["ThemeProvider<br/>next-themes"]
    
    style App fill:#f9f,stroke:#333,stroke-width:2px
    style ChatRoute fill:#bbf,stroke:#333,stroke-width:2px
    style CheckoutRoute fill:#bfb,stroke:#333,stroke-width:2px
```

#### 5.2 State Management

| Store | Technology | Purpose |
|-------|------------|---------|
| **Auth Store** | Zustand | User authentication state |
| **Cart Store** | Zustand | Shopping cart state |
| **Chat Store** | Zustand | Chat messages, session ID |
| **Server State** | TanStack Query | API data caching |

### 6. Security Architecture

#### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant F as 📝 Login Form
    participant S as ⚙️ Server
    participant B as 🔐 bcrypt
    participant J as 🎫 JWT
    participant Z as 📦 Zustand Store
    
    C->>F: Enter credentials
    F->>S: POST /api/login<br/>{email, password}
    S->>B: Compare password hash
    B-->>S: Valid/Invalid
    
    alt Valid Credentials
        S->>J: Generate JWT token
        J-->>S: Token
        S-->>F: Return {token, user}
        F->>Z: Store auth state
        Z-->>C: Auth success
    else Invalid Credentials
        S-->>F: 401 Unauthorized
        F-->>C: Show error
    end
```

#### 6.2 Security Measures

| Layer | Implementation |
|-------|----------------|
| **Password Hashing** | bcrypt with salt rounds: 10 |
| **Token Signing** | JWT with HS256 algorithm |
| **Token Storage** | httpOnly cookies (backend) / memory (frontend) |
| **Session Management** | MongoDB-backed with UUID |
| **CORS** | Whitelist-based origins |
| **Input Validation** | Yup schemas on frontend, manual validation on backend |
| **NoSQL Injection** | Input sanitization and schema validation |

### 7. Performance Considerations

#### 7.1 Optimizations

| Area | Strategy | Implementation |
|------|----------|----------------|
| **Database** | Connection pooling | MongoDB native driver with connection pooling |
| **Search** | Pre-computed embeddings | JSON file caching |
| **Images** | CDN delivery | ImageKit integration |
| **Frontend** | Code splitting | Vite dynamic imports |
| **State** | Selective subscriptions | Zustand shallow equality |
| **API** | Response caching | TanStack Query stale-while-revalidate |

#### 7.2 Caching Strategy

```mermaid
flowchart TB
    subgraph L1["💾 L1: In-Memory"]
        E1["Embeddings<br/>Loaded at startup"]
        E2["EmbeddingService<br/>Singleton"]
    end
    
    subgraph L2["🔄 L2: TanStack Query"]
        T1["API Responses Cache"]
        T2["Stale Time: 5 min"]
        T3["Cache Time: 10 min"]
    end
    
    subgraph L3["🍪 L3: Browser Storage"]
        B1["JWT Token<br/>Memory"]
        B2["Session ID<br/>Cookie"]
    end
    
    L1 --> L2
    L2 --> L3
    
    style L1 fill:#e1f5fe,stroke:#333,stroke-width:2px
    style L2 fill:#fff3e0,stroke:#333,stroke-width:2px
    style L3 fill:#e8f5e9,stroke:#333,stroke-width:2px
```

### 8. Deployment Architecture

#### 8.1 Docker Configuration

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["5200:5200"]
    env_file:
      - ./backend/.env
    restart: unless-stopped
      
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
    restart: unless-stopped
```
