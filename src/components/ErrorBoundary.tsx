import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering issue occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B192C] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white text-slate-900 rounded-md border border-slate-200 shadow-2xl p-7 text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7A31]">
              Al Amaan Real Estate &amp; Developers
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#0B192C]">
              Display Refresh Needed
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              The page encountered a temporary display issue in this browser session. Reloading restores the full website cleanly.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
              >
                Reload Website
              </button>
              <a
                href="/"
                className="px-5 py-2.5 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:border-[#0B192C]"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
