

Full-Stack Engineer Assignment: AI-Powered Food Ordering SystemFull-Stack Engineer Assignment: AI-Powered Food Ordering System
OverviewOverview
Build an intelligent food ordering platform for a restaurant that leverages AI to help customers discover and order food through natural conversations. The system
should understand customer preferences, dietary requirements, and contextual requests to provide personalized food recommendations.
The ChallengeThe Challenge
Create a chat-based food ordering experiencechat-based food ordering experience where users interact with an intelligent agent to discover and order food. This is a conversational interface where
customers chat with an AI agent that understands their needs, asks clarifying questions, and helps them find the perfect meal—just like talking to a knowledgeable
salesperson at a restaurant.
What We're Looking ForWhat We're Looking For
We're evaluating:
Product thinking & problem understandingProduct thinking & problem understanding: How well you interpret the requirements and make thoughtful decisions about the user experience
ImplementationImplementation: Proper frontend and backend development with effective AI integration
AI chat experienceAI chat experience: The quality of the conversational interface, especially the dynamic UI capabilitiesdynamic UI capabilities—how the agent generates rich, interactive UI components
(like food cards with images) instead of just text responses
Core RequirementsCore Requirements
## 1. Conversational Interface1. Conversational Interface
Build a chat-based interface where users can:
Ask questions about food options (e.g., "What vegetarian options do you have?")
Request specific dietary requirements (e.g., "I need something high in protein, low in carbs")
Make complex queries (e.g., "I need chicken-based lunch with a salad and juice")
Add items to cart conversationally (e.g., "Add two large pizzas to my cart")
- Dynamic UI Components2. Dynamic UI Components
The chat interface should display rich, interactive UI elementsrich, interactive UI elements, not just text responses. Here are examples of what you could build (you have the freedom to choose
which ones to implement):
Food cardsFood cards with images, descriptions, nutritional info, and pricing
Multiple item displaysMultiple item displays when showing recommendations
Add to cart buttonsAdd to cart buttons directly on food cards with quantity selectors
Cart summaryCart summary components
Order formOrder form for checkout
The key is creating a visual, interactive experience within the chat rather than plain text responses.
- Agent Intelligence and Interaction3. Agent Intelligence and Interaction
The agent should effectively solve user problems through intelligent, multi-turn conversations:
Ask follow-up questions when user requests are ambiguous or unclear
Understand context from previous messages in the conversation
Act like a helpful salesperson in a restaurant—not just one question, one response, but a natural back-and-forth dialogue
ExampleExample: If a user asks for "pizza" and there are multiple options, the agent should ask clarifying questions about size, toppings, etc., then recommend based
on the user's preferences
## 4. Cart & Checkout4. Cart & Checkout
Users can add items via UI buttons or conversational commands
Maintain cart state throughout the session
Implement a checkout flow with a delivery form
Payment method: Cash on Delivery (no payment gateway integration needed)
## 5. Data Source5. Data Source
You'll receive a markdown file containing 100+ food items with:
Food name and description
## Images
Detailed preparation information
Ingredients list
Nutritional information (calories, protein, carbs, etc.)
Pricing (including size variants where applicable)
## Category/type
Use this data to power your semantic search and recommendations. You're free to:

Use any LLM or AI service (OpenAI, Anthropic, etc.)
Implement semantic search/embeddings
Use assistants APIs, RAG, or other agentic patterns
Example InteractionsExample Interactions
Scenario 1:Scenario 1:
User: "I need something for lunch, chicken-based, high protein, low carb"
Agent: [Shows 3 chicken options as food cards with nutritional info]
"Here are our best high-protein, low-carb chicken options.
Would you like to add any sides or drinks?"
User: "Yes, I'd like a salad and juice with that"
Agent: [Shows salad and juice options as cards]
"Great choices! Here are salads and fresh juices that pair well.
Which ones would you like?"
User: "Add the Grilled Chicken Breast, Caesar Salad, and Orange Juice to my cart"
Agent: "Perfect! I've added:
## • Grilled Chicken Breast - ₹399
## • Caesar Salad - ₹249
## • Fresh Orange Juice - ₹99

## Total: ₹747

Would you like to checkout or continue browsing?"
Scenario 2:Scenario 2:
User: "Add a large pizza to my cart"
Agent: "We have several large pizzas! Here are our options:"
[Shows pizza cards: Margherita, Pepperoni, BBQ Chicken, Veggie Supreme]
"Which one sounds good to you?"
User: "What's in the BBQ Chicken pizza?"
Agent: "Our BBQ Chicken Pizza has:
- Grilled chicken
- BBQ sauce base
- Red onions
## • Cilantro
- Mozzarella cheese

It's one of our most popular items! Want to add it?"
User: "Yes, add two of those"
Agent: "Added 2 Large BBQ Chicken Pizzas to your cart! (₹549 each)

Anything else you'd like?"
Scenario 3:Scenario 3:

User: "What vegetarian options do you have?"
Agent: [Shows 6-8 vegetarian items as food cards across different categories]
"We have lots of vegetarian options! I'm showing you our:
## • Salads
- Veggie pizzas
- Pasta dishes
- Veggie burgers

What type of meal are you in the mood for?"
User: "I don't like any of these. Do you have something with paneer?"
Agent: [Shows paneer-based items]
"Absolutely! Here are our paneer dishes. The Paneer Tikka and
Palak Paneer are customer favorites. Would either of these work?"
User: "The Palak Paneer looks good. Can I get it with naan?"
Agent: "Great choice! I can add both to your cart:
## • Palak Paneer - ₹379
## • Garlic Naan - ₹69

Should I add these?"
User: "Yes please"
Agent: "Done! Added to your cart. Ready to checkout?"
Technical ConsiderationsTechnical Considerations
Must HaveMust Have
FrontendFrontend: React or Next.js
BackendBackend: Next.js, Node.js, Python, or Tanstack Start (you can use fullstack frameworks that combine both)
AI/LLM integration for conversation handling
Cart state management
Docker setupDocker setup: Complete Docker configuration for easy local testing
Nice to HaveNice to Have
User authentication (simple is fine)
Polished, elegant UI
Traditional e-commerce browse view alongside chat
Freedom to ChooseFreedom to Choose
Come up with your own restaurant name and branding
Tech stack and architecture
AI provider and implementation approach
Design system and styling approach
DeliverablesDeliverables
- GitHub repositoryGitHub repository with comprehensive README including:
Clear setup and installation instructions
Prerequisites and environment setup
Step-by-step guide to run the application locally
Architecture decisions and rationale
AI approach explanation
Any assumptions made
Troubleshooting guide (if applicable)
- Docker environmentDocker environment - Provide a complete Docker setup (Dockerfile and docker-compose.yml) so we can easily test your application with a single command
- Screen recordingScreen recording (Loom or similar, 3-5 minutes) demonstrating:
The complete setup process
Key user interactions and conversation flows
Dynamic UI components in action
Cart and checkout functionality

Evaluation CriteriaEvaluation Criteria
CriteriaCriteriaWhat We're Looking ForWhat We're Looking For
Product ThinkingProduct ThinkingThoughtful UX decisions and user-centric design choices
ProblemProblem
UnderstandingUnderstanding
How well you grasp the core requirements and challenges
ImplementationImplementationProper frontend, backend, and AI integration working together
UnderstandingUnderstanding
In-depth knowledge of your implementation—ability to explain architecture decisions, trade-offs, and how different
parts work together
SpeedSpeedDevelopment velocity and ability to deliver a working solution efficiently
CreativityCreativityCreative solutions to solve user problems and enhance the ordering experience
CompletenessCompletenessCore features working end-to-end
TipsTips
Focus on the experienceFocus on the experience - The chat + dynamic UI combination is the key differentiator
Make opinionated choicesMake opinionated choices - We value your product decisions and reasoning
Start simple, then enhanceStart simple, then enhance - Get the core loop working first, then add polish
Use AI tools freelyUse AI tools freely - You're encouraged to use AI assistants, code generators, and development tools to move faster
Documentation mattersDocumentation matters - Clear README with proper setup instructions helps us evaluate your work quickly
Docker is essentialDocker is essential - A working Docker setup shows production readiness and makes testing seamless