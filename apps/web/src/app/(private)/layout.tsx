import React from 'react';
import { Navbar } from '@/components/layouts/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
