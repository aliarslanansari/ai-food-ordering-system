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
import { ShoppingCart, LogOut, History, Utensils } from "lucide-react";
import type { User as UserType } from "@/types";

interface ChatHeaderProps {
  itemCount: number;
  onCartClick: () => void;
  user?: UserType;
}

export function ChatHeader({ itemCount, onCartClick, user }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-stone-200 bg-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
      <div className="max-w-7xl xl:max-w-8xl 2xl:max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white p-1.5 sm:p-2 rounded-lg">
            <Utensils className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-800">
              SpiceRoute
            </h1>
            <p className="text-[10px] sm:text-xs text-stone-500 hidden sm:block">
              AI-Powered Food Ordering
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCartClick}
            className="relative h-8 sm:h-9 px-2 sm:px-3"
          >
            <ShoppingCart className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Cart</span>
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
                  className="relative h-8 w-8 rounded-full p-0"
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 bg-orange-100">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-xs sm:text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-52 sm:w-56"
                align="end"
                forceMount
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/orders")}
                  className="text-sm"
                >
                  <History className="mr-2 h-4 w-4" />
                  Order History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/browse")}
                  className="text-sm"
                >
                  <Utensils className="mr-2 h-4 w-4" />
                  Browse Menu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Handle logout
                    window.location.href = "/login";
                  }}
                  className="text-red-600 text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Log in</span>
                <span className="sm:hidden">Login</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/signup")}
                className="bg-orange-600 hover:bg-orange-700 h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Sign up</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
