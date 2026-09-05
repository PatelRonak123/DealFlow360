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
  LuShield,
  LuUser,
} from 'react-icons/lu';
import { useAuth } from '../hooks/useAuth';
import { validateSignup } from '../schemas/auth.schema';
import { showProgressToast } from './ProgressToast';
import { getDashboardPathForRole } from '@/lib/accessControl';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SALES_MANAGER' | 'SALES_REP'>('SALES_MANAGER');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    const validation = validateSignup({ name, email, password });
    if (!validation.isValid) {
      setFormError(validation.error || 'Please fill in all fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      showProgressToast('Creating your account...', 35, 'signup-progress');

      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      showProgressToast('Configuring workspace...', 80, 'signup-progress');
      await new Promise((resolve) => setTimeout(resolve, 200));

      showProgressToast('Account ready!', 100, 'signup-progress');
      await new Promise((resolve) => setTimeout(resolve, 150));

      toast.success(`Account created! Welcome, ${result.user.name}!`, {
        id: 'signup-progress',
        duration: 3000,
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
        } else if (err.response?.status === 409) {
          message = 'An account with this email already exists. Please sign in instead.';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setFormError(message);
      toast.error(message, { id: 'signup-progress', duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[460px] py-14 lg:py-10">
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#3165E8]">
          Get Started
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#172033] sm:text-[38px]">
          Create your workspace account
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#76839A]">
          Start configuring quotes, approvals, and revenue operations.
        </p>
      </div>

      {formError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 shadow-sm animate-in fade-in duration-200">
          <LuCircleAlert className="mt-0.5 shrink-0 text-red-500" size={18} />
          <div className="flex-1">
            <p className="font-semibold">Registration Error</p>
            <p className="mt-0.5 text-xs leading-5 text-red-600">{formError}</p>
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm font-semibold text-[#27334A]">
            Full Name
          </label>
          <div className="relative">
            <LuUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]" size={18} />
            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Rajesh Malhotra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#DCE4F0] bg-white/80 pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#AAB5C5] focus:border-[#3165E8] focus:bg-white focus:ring-4 focus:ring-[#3165E8]/10"
            />
          </div>
        </div>
  
        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-[#27334A]">
            Email
          </label>
          <div className="relative">
            <LuMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]" size={18} />
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="manager@dealflow360.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-[#DCE4F0] bg-white/80 pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#AAB5C5] focus:border-[#3165E8] focus:bg-white focus:ring-4 focus:ring-[#3165E8]/10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-role" className="mb-2 block text-sm font-semibold text-[#27334A]">
            Role in Workspace
          </label>
          <div className="relative">
            <LuShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]" size={18} />
            <select
              id="signup-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'SALES_MANAGER' | 'SALES_REP')}
              className="h-12 w-full rounded-xl border border-[#DCE4F0] bg-white/80 pl-11 pr-4 text-sm text-[#172033] outline-none transition focus:border-[#3165E8] focus:bg-white focus:ring-4 focus:ring-[#3165E8]/10"
            >
              <option value="SALES_MANAGER">Sales Manager (Approvals & Quota Oversight)</option>
              <option value="SALES_REP">Sales Representative (Quotes & Pipeline)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-[#27334A]">
            Password
          </label>
          <div className="relative">
            <LuLockKeyhole
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BA]"
              size={18}
            />
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
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
          {isSubmitting ? 'Creating account...' : 'Create account'}{' '}
          {!isSubmitting && <LuArrowRight size={17} />}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#76839A]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#3165E8] hover:text-[#2148B4] underline-offset-2 hover:underline"
        >
          Sign in instead
        </Link>
      </p>

      <p className="mt-10 text-center text-xs text-[#AAB5C5]">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
};

export default SignupForm;