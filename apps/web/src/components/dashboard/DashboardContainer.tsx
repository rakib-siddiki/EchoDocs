'use client';

import { DashboardHeader } from './components/DashboardHeader';
import { NextSteps } from './components/NextSteps';

export default function DashboardContainer() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <DashboardHeader />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to your Dashboard
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-lg">
          This is where you will manage and upload your documentation files. 
          Use the User menu in the top right to configure your profile or sign out.
        </p>
        <NextSteps />
      </main>
    </div>
  );
}
