import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSignup } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const signupSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().optional(),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Signup() {
  const navigate = useNavigate();
  const signupMutation = useSignup();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      await signupMutation.mutateAsync(values);
      navigate("/");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-3 sm:p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl">🍛</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sign up to start ordering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={formik.handleSubmit}
            className="space-y-3 sm:space-y-4"
          >
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className="h-10 sm:h-11"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-xs sm:text-sm text-red-500">
                  {formik.errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className="h-10 sm:h-11"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs sm:text-sm text-red-500">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Phone (optional)
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.phone}
                className="h-10 sm:h-11"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className="h-10 sm:h-11"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs sm:text-sm text-red-500">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-11 mt-2"
              disabled={signupMutation.isPending || !formik.isValid}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
