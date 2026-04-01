import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.js';
import { useState } from 'react';

const schema = z.object({
  name:     z.string().min(1, 'Name required').max(50, 'Name too long (max 50 characters)'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function RegisterPage() {
  const navigate   = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const password = watch('password', '');

  // Calculate password strength
  const calculateStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const updateStrength = (pass) => {
    setPasswordStrength(calculateStrength(pass));
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-600';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  async function onSubmit(data) {
    try {
      const res = await authApi.register(data);
      setUser(res.data.user);
      navigate('/chat');
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Registration failed' });
    }
  }

  return (
    <div className="relative flex h-full min-h-screen items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#212121] to-[#2a2a2a] overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />
          
          {/* Card content */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#252525] p-8 shadow-2xl border border-white/10 backdrop-blur-sm">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-md opacity-50" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="mb-2 text-center text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Create account
            </h1>
            <p className="mb-8 text-center text-sm text-gray-400">
              Join us and start chatting with AI
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Full Name
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${
                  errors.name ? 'ring-2 ring-red-500/50' : 'focus-within:ring-2 focus-within:ring-purple-500/50'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-xl bg-[#1a1a1a] pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 border border-white/10 focus:border-purple-500/50"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Email Address
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${
                  errors.email ? 'ring-2 ring-red-500/50' : 'focus-within:ring-2 focus-within:ring-purple-500/50'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-[#1a1a1a] pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 border border-white/10 focus:border-purple-500/50"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field with Strength Meter */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Password
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${
                  errors.password ? 'ring-2 ring-red-500/50' : 'focus-within:ring-2 focus-within:ring-purple-500/50'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
                    </svg>
                  </div>
                  <input
                    {...register('password', {
                      onChange: (e) => updateStrength(e.target.value),
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-[#1a1a1a] pl-10 pr-12 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 border border-white/10 focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password strength meter */}
                {password && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level ? getStrengthColor() : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-gray-500">
                        {getStrengthText() && (
                          <span className={`font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>
                            {getStrengthText()} password
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {password.length}/8+ chars
                      </p>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Password requirements hint */}
              {!errors.password && password && password.length > 0 && passwordStrength < 4 && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                  <p className="text-[10px] text-blue-400 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Use uppercase, numbers & symbols for stronger password
                  </p>
                </div>
              )}

              {/* Root Error */}
              {errors.root && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#2a2a2a]"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text hover:from-purple-300 hover:to-pink-300 transition-all duration-200 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Terms hint */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-gray-600">
                By signing up, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}