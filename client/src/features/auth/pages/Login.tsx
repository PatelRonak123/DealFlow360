import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthBrand, AuthHero, LoginForm } from '../components';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to workspace
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F8FC] text-[#172033]">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#E4EEFF] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[#E8F8F1] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.88fr)]">
        <section className="flex flex-1 flex-col justify-between px-6 py-7 sm:px-10 lg:min-h-screen lg:px-16 lg:py-10 xl:px-24">
          <AuthBrand />
          <LoginForm />
          <p className="text-xs text-[#AAB5C5]">© 2026 DealFlow360 • Enterprise Revenue Platform</p>
        </section>

        <AuthHero />
      </div>
    </main>
  );
};

export default Login;
