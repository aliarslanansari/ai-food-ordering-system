import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, LogOut, History, Utensils } from "lucide-react";
import type { User as UserType } from "@/types";

interface ChatHeaderProps {
  itemCount: number;
  onCartClick: () => void;
  user?: UserType;
}

export function ChatHeader({ itemCount, onCartClick, user }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-stone-200 bg-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white p-2 rounded-lg">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">SpiceRoute</h1>
            <p className="text-xs text-stone-500">AI-Powered Food Ordering</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Cart Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8 bg-orange-100">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <History className="mr-2 h-4 w-4" />
                  Order History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Handle logout
                    window.location.href = "/login";
                  }}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/signup")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
