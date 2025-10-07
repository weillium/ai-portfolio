import { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-midnight-900 text-gray-100">
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-white/5 bg-midnight-900/70 backdrop-blur px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Agents Workbench</h1>
            <p className="text-sm text-gray-400">Launch, orchestrate, and resume your AI agent sessions.</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-midnight-900/60">
          {children}
        </div>
      </main>
    </div>
  );
}
