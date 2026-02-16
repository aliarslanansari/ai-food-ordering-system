import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Food } from "../types";
import { Image } from "./Image";

interface FoodCardProps {
  food: Food;
  onAddToCart: (food: Food, quantity: number) => void;
}

export function FoodCard({ food, onAddToCart }: FoodCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (typeof onAddToCart === "function") {
      onAddToCart(food, quantity);
      setQuantity(1);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full pt-0">
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <Image
          src={food.image_url}
          alt={food.name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge
          className={`absolute right-2 top-2 text-xs font-medium ${
            food.isVegetarian
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {food.isVegetarian ? "Veg" : "Non-Veg"}
        </Badge>
      </div>

      {/* Content */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {food.name}
          </h3>
          <span className="text-base font-bold text-blue-600 whitespace-nowrap">
            ₹{food.price}
          </span>
        </div>
        <p className="text-xs text-slate-500">{food.category}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="line-clamp-2 text-sm text-slate-600 leading-relaxed">
          {food.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className="text-xs font-normal bg-slate-100 text-slate-600"
          >
            {food.nutrition.calories} cal
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs font-normal bg-slate-100 text-slate-600"
          >
            {food.nutrition.protein}g protein
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs font-normal bg-slate-100 text-slate-600"
          >
            {food.nutrition.carbs}g carbs
          </Badge>
        </div>
      </CardContent>

      {/* Footer with Add to Cart */}
      <CardFooter className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between w-full gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-slate-200 hover:bg-slate-100"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold text-slate-700">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-slate-200 hover:bg-slate-100"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
