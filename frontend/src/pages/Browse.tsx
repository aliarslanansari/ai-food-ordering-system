import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FoodCard } from "../components/FoodCard";
import { CartSidebar } from "../components/CartSidebar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search } from "lucide-react";
import { useCartStore } from "../stores/cart";
import { useChatStore } from "../stores/chat";
import {
  useAddToCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useClearCart,
} from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { useFoods } from "../hooks/useFoods";
import type { Food } from "../types";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "calories", label: "Calories: Low to High" },
];

export default function Browse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const { data: foods = [], isLoading, error } = useFoods();

  const session_id = useChatStore((state) => state.session_id);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const itemCount = useCartStore((state) => state.item_count);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const closeCart = useCartStore((state) => state.closeCart);
  const addCartItem = useCartStore((state) => state.addItem);

  const addToCartMutation = useAddToCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();

  // Generate categories dynamically from foods data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(foods.map((food) => food.category));
    return ["All", ...Array.from(uniqueCategories).sort()];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    let result = [...foods];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query) ||
          food.ingredients.some((i: string) => i.toLowerCase().includes(query)),
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (food) =>
          food.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    if (selectedType === "veg") {
      result = result.filter((food) => food.isVegetarian);
    } else if (selectedType === "non-veg") {
      result = result.filter((food) => !food.isVegetarian);
    }

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
  }, [foods, searchQuery, selectedCategory, selectedType, sortBy]);

  const handleAddToCart = async (food: Food, quantity: number) => {
    if (!session_id) {
      // Add to local state first for immediate UI feedback
      addCartItem({
        id: `local_${Date.now()}`,
        food_id: food.id,
        food_name: food.name,
        quantity,
        price: food.price,
        added_at: Date.now(),
      });
      toast.info("Item saved locally. Start a chat to sync your cart.");
    } else {
      addToCartMutation.mutate({ food, quantity });
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header cartCount={itemCount} user={user} onCartClick={toggleCart} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg font-medium text-slate-900">
              Failed to load foods
            </p>
            <p className="text-sm text-slate-600">Please try again later</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header cartCount={itemCount} user={user} onCartClick={toggleCart} />

      <div className="sticky top-16 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container-responsive py-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search foods, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
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

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex-shrink-0"
                disabled={isLoading}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container-responsive py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  Showing <strong>{filteredFoods.length}</strong> items
                  {selectedCategory !== "All" && (
                    <>
                      {" "}
                      in{" "}
                      <Badge variant="secondary" className="text-xs">
                        {selectedCategory}
                      </Badge>
                    </>
                  )}
                </>
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
                disabled={isLoading}
              >
                Clear filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredFoods.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-2 text-lg font-medium text-slate-900">
                No foods found
              </p>
              <p className="text-sm text-slate-600">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <CartSidebar
        items={cartItems}
        total={cartTotal}
        itemCount={itemCount}
        isOpen={isCartOpen}
        onOpenChange={closeCart}
        onUpdateQuantity={(itemId, quantity) =>
          updateQuantityMutation.mutate({ itemId, quantity })
        }
        onRemoveItem={(itemId) => removeItemMutation.mutate(itemId)}
        onClearCart={() => clearCartMutation.mutate()}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
