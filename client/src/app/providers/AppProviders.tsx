import React, { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';

import { AuthProvider } from '@/features/auth';
import { SidebarProvider } from '@/context/SidebarContext';

export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
