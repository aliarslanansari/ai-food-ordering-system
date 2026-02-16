import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useChatStore } from "@/stores/chat";
import type { User, LoginInput, SignupInput, AuthResponse } from "@/types";
import { toast } from "sonner";

// API functions
const login = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

const signup = async (data: SignupInput): Promise<AuthResponse> => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

const getMe = async (): Promise<{ user: User }> => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Hooks
export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setCart = useCartStore((state) => state.setCart);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: (data: Omit<LoginInput, "session_id">) =>
      login({ ...data, session_id: session_id || undefined }),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      // Update cart if merged cart is returned
      if (data.cart) {
        setCart(data.cart);
      }
      queryClient.setQueryData(["user"], { user: data.user });
      toast.success("Welcome back!");
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Login failed");
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setCart = useCartStore((state) => state.setCart);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: (data: Omit<SignupInput, "session_id">) =>
      signup({ ...data, session_id: session_id || undefined }),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      // Update cart if merged cart is returned
      if (data.cart) {
        setCart(data.cart);
      }
      queryClient.setQueryData(["user"], { user: data.user });
      toast.success("Account created successfully!");
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Signup failed");
    },
  });
}

export function useMe() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  return useQuery({
    queryKey: ["user"],
    queryFn: getMe,
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    meta: {
      onError: () => {
        logout();
      },
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return () => {
    logout();
    queryClient.clear();
    toast.info("Logged out successfully");
  };
}

// Combined hook for convenience
export function useAuth() {
  const { data: userData } = useMe();
  const login = useLogin();
  const signup = useSignup();
  const logout = useLogout();
  const { token } = useAuthStore();

  return {
    user: userData?.user,
    token,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };
}
