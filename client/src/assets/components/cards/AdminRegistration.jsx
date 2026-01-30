import axios from "axios";
import { Eye, EyeOff, Loader } from "lucide-react";
import React, { useState, useNavigate } from "react";
import { toast } from "react-toastify";
import { useSuperAdminCheck } from "../../../hooks/useSuperAdminCheck";

const AdminRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setExists } = useSuperAdminCheck();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_API_BASE_URL}/setup/create-super-admin`,
        formData
      );

      if (!data.success) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success(data.message || "Admin account created successfully!");
      setExists(true);
      navigate('/login')
      window.location.reload();

      // Reset form after successful registration
      setFormData({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        toast.error(error.response.data?.message || "Registration failed");
      } else if (error.request) {
        // Network error
        toast.error("Network error. Please check your connection.");
      } else {
        // Other errors
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4 border border-gray-200">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-bold text-2xl text-[#212529]">
          Admin Registration
        </h1>
        <p className="text-gray-600">Create your administrator account</p>
      </div>

      {/* Form */}
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#212529] mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent transition-all"
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#212529] mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent transition-all"
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#212529] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D6EFD] focus:border-transparent transition-all pr-10"
                placeholder="Create a password"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0D6EFD] text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none cursor-pointer focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            className="text-[#0D6EFD] hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminRegistration;
