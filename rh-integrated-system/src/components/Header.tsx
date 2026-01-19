'use client';

import React from 'react';

export default function Header() {
  return (
    <div className="text-center mb-16 relative py-8">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full animate-pulse"></div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 blur-[60px] -z-10 rounded-full"></div>
      
      <div className="relative inline-block animate-fade-in">
        <h1 className="text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          مكتب رحلة هدف للحلول الرقمية
        </h1>
        <div className="absolute -right-4 -top-4 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 rounded-tr-lg"></div>
        <div className="absolute -left-4 -bottom-4 w-8 h-8 border-b-2 border-l-2 border-purple-500/30 rounded-bl-lg"></div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 animate-fade-in delay-2">
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-slate-700"></div>
        <p className="text-slate-400 text-sm font-black tracking-[0.2em] uppercase">
          النظام المالي المتكامل
        </p>
        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-slate-700"></div>
      </div>

      <div className="mt-8 flex justify-center gap-3 animate-fade-in delay-3">
        <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">v2.0 Glassmorphism</span>
        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Real-time Data</span>
      </div>
    </div>
  );
}
