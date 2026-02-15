import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Flame, Dumbbell, Wheat } from "lucide-react";
import { useState } from "react";
import type { Food } from "@/types";

interface FoodCardProps {
  food: Food;
  onAddToCart: (food: Food, quantity: number) => void;
  compact?: boolean;
}

export function FoodCard({
  food,
  onAddToCart,
  compact = false,
}: FoodCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAddToCart(food, quantity);
    setQuantity(1);
  };

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="w-24 h-24 bg-stone-200 flex-shrink-0">
            {food.imageUrl ? (
              <img
                src={food.imageUrl}
                alt={food.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-3">
            <h3 className="font-semibold text-sm line-clamp-1">{food.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {food.category}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-orange-600">₹{food.price}</span>
              <Button
                size="sm"
                className="h-7 px-2"
                onClick={() => onAddToCart(food, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-stone-200 relative">
        {food.imageUrl ? (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <span>No image available</span>
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 ${
            food.isVegetarian
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-red-100 text-red-800 hover:bg-red-100"
          }`}
        >
          {food.isVegetarian ? "Veg" : "Non-Veg"}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{food.name}</CardTitle>
            <CardDescription className="text-sm">
              {food.category}
            </CardDescription>
          </div>
          <span className="text-xl font-bold text-orange-600">
            ₹{food.price}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {food.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Flame className="h-3 w-3 mr-1" />
            {food.nutrition.calories} cal
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Dumbbell className="h-3 w-3 mr-1" />
            {food.nutrition.protein}g protein
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Wheat className="h-3 w-3 mr-1" />
            {food.nutrition.carbs}g carbs
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {food.ingredients.slice(0, 4).map((ingredient, idx) => (
            <span
              key={idx}
              className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded"
            >
              {ingredient}
            </span>
          ))}
          {food.ingredients.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{food.ingredients.length - 4} more
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
