import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  LuArrowRight,
  LuCircleAlert,
  LuEye,
  LuEyeOff,
  LuLockKeyhole,
  LuMail,
} from 'react-icons/lu';
import { useAuth } from '../hooks/useAuth';
import { validateLogin } from '../schemas/auth.schema';
import { getDashboardPathForRole } from '@/lib/accessControl';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      setFormError(validation.error || 'Please fill in all fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });

      toast.success(`Welcome back, ${result.user.name}!`, {
        id: 'login-progress',
        duration: 2000,
      });

      const targetDashboard = getDashboardPathForRole(result.user.activeRole || result.user.role);
      navigate(targetDashboard, { replace: true });
    } catch (err: unknown) {
      let message = 'Unable to connect to authentication server.';

      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data?.error?.message;
        const serverMessage = err.response?.data?.message;

        if (serverError) {
          message = serverError;
        } else if (serverMessage) {
          message = serverMessage;
        } else if (err.code === 'ERR_NETWORK') {
          message = 'Cannot connect to backend server at http://localhost:5000. Is the server running?';
        } else if (err.response?.status === 401) {
          message = 'Invalid email or password. Please check your credentials.';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setFormError(message);
      toast.error(message, { id: 'login-progress', duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[460px] py-14 lg:py-10">
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#3165E8]">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#172033] sm:text-[38px]">
          Sign in to your workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#76839A]">
          Access your deals and keep your team moving forward.
        </p>
      </div>

      {formError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 shadow-sm animate-in fade-in duration-200">
          <LuCircleAlert className="mt-0.5 shrink-0 text-red-500" size={18} />
          <div className="flex-1">
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-0.5 text-xs leading-5 text-red-600">{formError}</p>
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#27334A]">
            Email
          </label>
          <div className="relative">
            <LuMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]" size={18} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#DCE4F0] bg-white/80 pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#AAB5C5] focus:border-[#3165E8] focus:bg-white focus:ring-4 focus:ring-[#3165E8]/10"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-[#27334A]">
              Password
            </label>
            <button
              type="button"
              onClick={() => toast('Password reset link will be sent to your email.')}
              className="text-xs font-semibold text-[#3165E8] transition hover:text-[#2148B4]"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <LuLockKeyhole
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]"
              size={18}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#DCE4F0] bg-white/80 pl-11 pr-12 text-sm text-[#172033] outline-none transition placeholder:text-[#AAB5C5] focus:border-[#3165E8] focus:bg-white focus:ring-4 focus:ring-[#3165E8]/10"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8D9AAF] transition hover:bg-[#EEF4FF] hover:text-[#3165E8]"
            >
              {showPassword ? <LuEyeOff size={17} /> : <LuEye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3165E8] text-sm font-semibold text-white shadow-lg shadow-[#3165E8]/20 transition hover:bg-[#2856CE] focus:outline-none focus:ring-4 focus:ring-[#3165E8]/20 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'} {!isSubmitting && <LuArrowRight size={17} />}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#76839A]">
        New to DealFlow360?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[#3165E8] hover:text-[#2148B4] underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>

    </div>
  );
};

export default LoginForm;
