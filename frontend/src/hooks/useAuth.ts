import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
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

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.setQueryData(["user"], data.user);
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

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.setQueryData(["user"], data.user);
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
