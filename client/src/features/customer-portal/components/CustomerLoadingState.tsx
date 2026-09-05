import React from 'react';

export const CustomerLoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading deal operations data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 rounded-full border-4 border-[#3568ed]/20"></div>
        <div className="h-12 w-12 rounded-full border-4 border-[#3568ed] border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-[#647592]">{message}</p>
    </div>
  );
};
