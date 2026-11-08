// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // This logs the exact red error trace to your browser console
    console.error("DNA App Crash Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <AlertTriangle className="text-rose-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Component Error</h2>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
              We caught a rogue error before it could break the platform. Please reload the app.
            </p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="w-full text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm shadow-md hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
            >
              <RefreshCcw size={16} /> Return to Hub
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}