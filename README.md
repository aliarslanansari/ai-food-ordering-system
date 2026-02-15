# SpiceRoute - AI-Powered Food Ordering System

An intelligent conversational food ordering platform with AI-powered recommendations, built with React, TypeScript, Node.js, and SQLite.

![SpiceRoute Banner](https://via.placeholder.com/800x200/f97316/ffffff?text=SpiceRoute+AI+Food+Ordering)

## Features

### Core Features
- **AI-Powered Chat Interface**: Natural language food ordering with context-aware recommendations
- **Smart Food Recommendations**: Hybrid search combining semantic understanding with keyword matching
- **Guest & User Sessions**: Browse and order as guest, or create an account for order history
- **Real-time Cart Management**: Add, update, and remove items with persistent cart state
- **Secure Checkout**: Form-validated delivery information with order confirmation
- **Order History**: View past orders and track order status

### AI Capabilities
- **Intent Recognition**: Understands requests like "spicy vegetarian curries under ₹500"
- **Context Memory**: Remembers previous selections and preferences within a session
- **Smart Filters**: Automatically applies dietary, budget, and cuisine filters
- **Multi-turn Conversations**: Follow-up questions and refinement of recommendations

### Technical Highlights
- **JWT Authentication**: Secure user authentication with bcrypt password hashing
- **Session Management**: SQLite-backed sessions with automatic linking to user accounts
- **Responsive Design**: Mobile-first UI built with shadcn/ui components
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **State Management**: Zustand for client state, TanStack Query for server state

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: Formik with Yup validation
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **AI/ML**: Google Gemini API for embeddings and chat
- **Authentication**: JWT with bcrypt
- **Vector Search**: Cosine similarity for semantic search

## Project Structure

```
ai-food-ordering/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── config/               # Environment configuration
│   │   ├── data/                 # Food data and embeddings
│   │   ├── db/                   # Database schema
│   │   ├── middleware/           # Auth middleware
│   │   ├── routes/               # API routes
│   │   │   ├── auth.routes.ts    # Authentication endpoints
│   │   │   ├── cart.routes.ts    # Cart management
│   │   │   ├── order.routes.ts   # Order creation & history
│   │   │   └── search.routes.ts  # AI search & chat
│   │   ├── services/             # Business logic
│   │   │   ├── auth.service.ts   # User authentication
│   │   │   ├── cart.service.ts   # Cart operations
│   │   │   ├── order.service.ts  # Order management
│   │   │   ├── retrieval.service.ts # Hybrid search
│   │   │   ├── intent.service.ts  # AI intent extraction
│   │   │   └── gemini.service.ts  # Gemini API integration
│   │   └── types/                # TypeScript types
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.ts                # API client with interceptors
│   │   ├── App.tsx               # Main app component
│   │   ├── components/           # UI components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── FoodCard.tsx      # Food display card
│   │   │   ├── ChatMessage.tsx   # Chat message variants
│   │   │   ├── CartSidebar.tsx   # Shopping cart drawer
│   │   │   └── ChatHeader.tsx    # App header with branding
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts        # Authentication hooks
│   │   │   ├── useChat.ts        # Chat mutation hook
│   │   │   └── useOrders.ts      # Order management hooks
│   │   ├── pages/                # Page components
│   │   │   ├── Chat.tsx          # Main chat interface
│   │   │   ├── Browse.tsx        # Food browsing page
│   │   │   ├── Checkout.tsx      # Checkout form
│   │   │   ├── OrderConfirmation.tsx # Order success page
│   │   │   ├── OrderHistory.tsx  # Order history page
│   │   │   ├── Login.tsx         # Login page
│   │   │   └── Signup.tsx        # Signup page
│   │   ├── stores/               # Zustand stores
│   │   │   ├── auth.ts           # Auth state
│   │   │   ├── cart.ts           # Cart state
│   │   │   └── chat.ts           # Chat state
│   │   └── types/                # TypeScript types
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-food-ordering
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Backend:
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
   
   Frontend:
   ```bash
   cd ../frontend
   cp .env.example .env
   # Default values should work for local development
   ```

5. **Generate food embeddings** (one-time setup)
   ```bash
   cd ../backend
   npx tsx src/scripts/generate-embeddings.ts
   ```

### Running the Application

**Option 1: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

**Option 2: Run with Docker**
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5200
- Health Check: http://localhost:5200/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Chat & Search
- `POST /api/search` - Send message to AI assistant
- `GET /api/search/:sessionId/history` - Get chat history
- `GET /api/search/:sessionId/context` - Get session context

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update item quantity
- `DELETE /api/cart/items/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order from cart (authenticated)
- `GET /api/orders` - Get order history (authenticated)
- `GET /api/orders/stats` - Get order statistics (authenticated)
- `GET /api/orders/:orderId` - Get order details (authenticated)
- `POST /api/orders/:orderId/cancel` - Cancel order (authenticated)

## Usage Guide

### As a Guest
1. Visit the chat page
2. Start chatting with the AI assistant (e.g., "Show me vegetarian curries")
3. Add recommended items to cart
4. Click cart to proceed to checkout
5. Login or signup required to complete order

### As a Registered User
1. Sign up with email, name, phone, and password
2. Login to access full features
3. Chat with AI for recommendations
4. Add items to cart
5. Proceed to checkout with saved delivery info
6. View order history in `/orders` page

### Example Chat Queries
- "Show me some spicy appetizers under ₹300"
- "I want high protein non-vegetarian dishes"
- "Recommend something for 4 people around ₹1000"
- "Add 2 Butter Chicken and 1 Garlic Naan to cart"
- "What are your popular desserts?"

## Database Schema

### Tables
- **users**: Registered user accounts
- **sessions**: Guest and user conversation sessions
- **messages**: Chat history with intent and filters
- **session_context**: Quick access to conversation state
- **carts**: Shopping carts linked to sessions/users
- **cart_items**: Individual cart items
- **orders**: Completed orders with delivery info
- **order_items**: Items in completed orders

## Development

### Adding New Food Items
1. Edit `backend/src/data/foods.json`
2. Run `npx tsx src/scripts/generate-embeddings.ts`
3. Restart backend server

### Customizing the AI
Modify the system prompt in `backend/src/services/intent.service.ts` to change AI behavior and recommendations.

### Frontend Component Development
The project uses shadcn/ui. Add new components with:
```bash
cd frontend
npx shadcn add <component-name>
```

## Deployment

### Environment Variables for Production

**Backend (.env)**:
```
NODE_ENV=production
PORT=5200
JWT_SECRET=<strong-random-secret>
GEMINI_API_KEY=<your-api-key>
```

**Frontend (.env)**:
```
VITE_API_URL=https://your-api-domain.com/api
```

### Docker Deployment
```bash
docker-compose -f docker-compose.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [TanStack Query](https://tanstack.com/query) for server state management
- [Zustand](https://github.com/pmndrs/zustand) for client state management

---

Built with ❤️ for the Full-Stack Engineer Assignment
