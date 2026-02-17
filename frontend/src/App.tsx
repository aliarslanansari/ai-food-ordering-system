import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Skeleton } from "./components/ui/skeleton";

// Lazy load pages
const Chat = lazy(() => import("./pages/Chat"));
const Browse = lazy(() => import("./pages/Browse"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-2/3" />
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Chat />} />
          <Route path="/browse" element={<Browse />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
