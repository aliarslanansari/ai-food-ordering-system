import { FoodCard } from "./FoodCard";
import type { Food } from "@/types";

interface FoodCardGridProps {
  foods: Food[];
  onAddToCart: (food: Food, quantity: number) => void;
  title?: string;
  subtitle?: string;
}

export function FoodCardGrid({
  foods,
  onAddToCart,
  title,
  subtitle,
}: FoodCardGridProps) {
  if (foods.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {foods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onAddToCart={onAddToCart}
            compact
          />
        ))}
      </div>
    </div>
  );
}
