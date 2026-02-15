import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowLeft, ShoppingCart, Leaf, Flame } from "lucide-react";
import { FoodCard } from "@/components/FoodCard";
import { CartSidebar } from "@/components/CartSidebar";
import { useCartStore } from "@/stores/cart";
import { useChatStore } from "@/stores/chat";
import { useAddToCart } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import foods from "../../../backend/src/data/foods.json";

const CATEGORIES = [
  "All",
  "Appetizers",
  "Main Course",
  "Breads",
  "Rice & Biryani",
  "Desserts",
  "Beverages",
];

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "veg", label: "Vegetarian", icon: Leaf },
  { value: "non-veg", label: "Non-Vegetarian", icon: Flame },
];

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "calories", label: "Calories: Low to High" },
];

// Transform food data from JSON to Food type
const transformFood = (food: (typeof foods)[0]): import("@/types").Food => ({
  id: food.id,
  name: food.name,
  description: food.description,
  category: food.category,
  type: food.type as "Vegetarian" | "Non-Vegetarian",
  spiceLevel: food.spiceLevel,
  ingredients: food.ingredients,
  nutrition: food.nutrition,
  price: food.price,
  serves: food.serves,
  imageUrl: food.image_url,
  isVegetarian: food.type === "Vegetarian",
});

export default function BrowsePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const sessionId = useChatStore((state) => state.sessionId);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const itemCount = useCartStore((state) => state.itemCount);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const addCartItem = useCartStore((state) => state.addItem);

  const addToCartMutation = useAddToCart();

  // Filter and sort foods
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query) ||
          food.ingredients.some((i) => i.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (food) =>
          food.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Type filter
    if (selectedType === "veg") {
      result = result.filter((food) => food.type === "Vegetarian");
    } else if (selectedType === "non-veg") {
      result = result.filter((food) => food.type === "Non-Vegetarian");
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "calories":
        result.sort((a, b) => a.nutrition.calories - b.nutrition.calories);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedType, sortBy]);

  const handleAddToCart = async (
    food: import("@/types").Food,
    quantity: number,
  ) => {
    if (!sessionId) {
      // Add to local cart store only
      addCartItem({
        id: `local_${Date.now()}`,
        foodId: food.id,
        foodName: food.name,
        quantity,
        price: food.price,
        addedAt: Date.now(),
      });
    } else {
      // Add via API - find original food data
      const originalFood = foods.find((f) => f.id === food.id);
      if (originalFood) {
        await addToCartMutation(
          originalFood as unknown as import("@/types").Food,
          quantity,
        );
      }
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back & Logo */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-stone-800 hidden sm:block">
                Browse Menu
              </h1>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search foods, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Right: Cart */}
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-t border-stone-200 bg-stone-50/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Pills */}
              <ScrollArea className="flex-1 whitespace-nowrap">
                <div className="flex gap-2 pb-1">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-orange-600 text-white"
                          : "bg-white text-stone-700 border border-stone-200 hover:border-orange-300"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FILTERS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon && <type.icon className="h-4 w-4" />}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-stone-600">
            Showing <strong>{filteredFoods.length}</strong> items
            {selectedCategory !== "All" && (
              <span>
                {" "}
                in <Badge variant="secondary">{selectedCategory}</Badge>
              </span>
            )}
          </p>
          {(searchQuery ||
            selectedCategory !== "All" ||
            selectedType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedType("all");
                setSortBy("default");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Food Grid */}
        {filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={transformFood(food)}
                onAddToCart={handleAddToCart}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500 text-lg mb-2">No foods found</p>
            <p className="text-stone-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        items={cartItems}
        total={cartTotal}
        itemCount={itemCount}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
