import React from 'react';
import { LuWorkflow } from 'react-icons/lu';
import { Link } from 'react-router-dom';

export const AuthBrand: React.FC = () => {
  return (
    <Link to="/login" className="inline-flex items-center gap-3 transition hover:opacity-90">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3165E8] text-white shadow-lg shadow-[#3165E8]/20">
        <LuWorkflow size={22} />
      </span>
      <span className="text-3xl font-bold tracking-[-0.03em] text-[#172033]">DealFlow360</span>
    </Link>
  );
};

export default AuthBrand;
