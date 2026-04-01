import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.js';

// ─── Schemas ────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name:  z.string().min(1, 'Name required').max(50, 'Max 50 characters'),
  email: z.string().email('Invalid email'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── Password strength (same logic as RegisterPage) ─────────────────────────
function calcStrength(pass) {
  let s = 0;
  if (pass.length >= 8) s++;
  if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) s++;
  if (pass.match(/[0-9]/)) s++;
  if (pass.match(/[^a-zA-Z0-9]/)) s++;
  return s;
}
function strengthColor(s) {
  if (s === 0) return 'bg-gray-600';
  if (s === 1) return 'bg-red-500';
  if (s === 2) return 'bg-yellow-500';
  if (s === 3) return 'bg-blue-500';
  return 'bg-green-500';
}
function strengthText(s) {
  if (s === 0) return '';
  if (s === 1) return 'Weak';
  if (s === 2) return 'Fair';
  if (s === 3) return 'Good';
  return 'Strong';
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ user, onSaved }) {
  const { setUser } = useAuthStore();
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const debounceRef = useRef(null);

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const watchedEmail = watch('email');

  useEffect(() => {
    if (!watchedEmail || watchedEmail === user.email) {
      setEmailStatus(null);
      return;
    }
    // Basic format check before hitting the server
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail)) {
      setEmailStatus(null);
      return;
    }
    clearTimeout(debounceRef.current);
    setEmailStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkEmail(watchedEmail);
        setEmailStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setEmailStatus(null);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [watchedEmail, user.email]);

  async function onSubmit(data) {
    if (emailStatus === 'taken') return;
    try {
      const res = await authApi.updateProfile(data);
      setUser({ ...res.data.user });
      onSaved();
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Failed to update profile' });
    }
  }

  const saveDisabled = isSubmitting || emailStatus === 'checking' || emailStatus === 'taken';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
        <input
          {...register('name')}
          type="text"
          className="w-full rounded-xl bg-[var(--bg-input)] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
        <input
          {...register('email')}
          type="email"
          className="w-full rounded-xl bg-[var(--bg-input)] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
        />
        {emailStatus === 'checking' && (
          <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Checking availability…
          </p>
        )}
        {emailStatus === 'available' && (
          <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
            Email is available
          </p>
        )}
        {emailStatus === 'taken' && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
            Email already in use
          </p>
        )}
        {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
      </div>

      {/* Root error */}
      {errors.root && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saveDisabled}
        className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-700/25 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-panel)]"
      >
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

// ─── Password Tab ─────────────────────────────────────────────────────────────
function PasswordTab() {
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [strength, setStrength] = useState(0);

  const { register, handleSubmit, reset, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const newPass = watch('newPassword', '');

  async function onSubmit(data) {
    try {
      await authApi.updatePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setSuccess(true);
      setStrength(0);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError('root', { message: err.response?.data?.error || 'Failed to update password' });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
      {/* Current password */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
        <div className="relative">
          <input
            {...register('currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-xl bg-[var(--bg-input)] pl-4 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          />
          <button type="button" onClick={() => setShowCurrent(v => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showCurrent
                ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              }
            </svg>
          </button>
        </div>
        {errors.currentPassword && <p className="mt-1.5 text-xs text-red-400">{errors.currentPassword.message}</p>}
      </div>

      {/* New password */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
        <div className="relative">
          <input
            {...register('newPassword', { onChange: e => setStrength(calcStrength(e.target.value)) })}
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-xl bg-[var(--bg-input)] pl-4 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          />
          <button type="button" onClick={() => setShowNew(v => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showNew
                ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              }
            </svg>
          </button>
        </div>
        {newPass.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(l => (
                <div key={l} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= l ? strengthColor(strength) : 'bg-gray-700'}`} />
              ))}
            </div>
            {strengthText(strength) && (
              <p className="text-[10px] text-gray-500">{strengthText(strength)} password</p>
            )}
          </div>
        )}
        {errors.newPassword && <p className="mt-1.5 text-xs text-red-400">{errors.newPassword.message}</p>}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full rounded-xl bg-[var(--bg-input)] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
        />
        {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Password updated successfully
          </p>
        </div>
      )}

      {/* Root error */}
      {errors.root && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-700/25 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-panel)]"
      >
        {isSubmitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose }) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [savedBanner, setSavedBanner] = useState(false);

  function handleSaved() {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-700/15 to-violet-700/15 rounded-2xl blur pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-lg font-bold text-[var(--text-base)]">
              My Profile
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avatar + meta */}
          <div className="flex flex-col items-center py-5">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 blur-md opacity-50" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-violet-700 text-2xl font-bold text-white shadow-lg">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <p className="text-sm font-semibold text-[var(--text-base)]">{user?.name}</p>
            {joinedDate && <p className="text-xs text-gray-500 mt-0.5">Joined {joinedDate}</p>}
          </div>

          {/* Saved banner */}
          {savedBanner && (
            <div className="mx-5 mb-3 rounded-xl bg-green-500/10 border border-green-500/20 p-2.5 animate-in fade-in duration-300">
              <p className="text-xs text-green-400 flex items-center gap-2">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Profile updated successfully
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-white/10 mx-5">
            {['profile', 'password'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-all duration-200 border-b-2 ${
                  tab === t
                    ? 'text-purple-400 border-purple-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {t === 'profile' ? 'Profile' : 'Password'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'profile'
            ? <ProfileTab user={user} onSaved={handleSaved} />
            : <PasswordTab />
          }
        </div>
      </div>
    </div>
  );
}
