import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const AuthHero: React.FC = () => {
  return (
    <aside className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-[#EAF2FF] px-10 lg:flex">
      <div className="absolute right-[-8rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full border-[34px] border-white/70" />
      <div className="absolute bottom-[-10rem] left-[-9rem] h-[30rem] w-[30rem] rounded-full border-[26px] border-[#DCEAFF]" />
      <div className="relative w-full max-w-[520px]">
        <div className="mb-5 inline-flex rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#3165E8]">
          End-to-End B2B Sales Operation Platform
        </div>
        <h2 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#172B52]">
          Move every deal forward.
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-[#647592]">
          Keep your pipeline, approvals, and customer relationships moving in sync.
        </p>
        <div className="mt-8 h-[300px] w-full max-w-[440px] sm:h-[360px]">
          <DotLottieReact
            src="https://lottie.host/e4efdd62-95fc-4d36-b0fc-dd637bad5a66/kZVXAsh69v.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    </aside>
  );
};

export default AuthHero;
