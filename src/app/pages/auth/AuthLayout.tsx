import React from 'react';
import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — image with organic wave */}
      <div className="hidden lg:block lg:w-[48%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
          alt="Students studying"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />

        {/* Organic wave overlay */}
        <svg
          className="absolute right-0 top-0 h-full w-40 xl:w-48 text-white"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M70,0 C20,25 20,75 70,100 L100,100 L100,0 Z"
            fill="currentColor"
          />
        </svg>

        {/* Bottom overlay bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <InstagramIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <TwitterIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Twitter (X)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form content */}
      <div className="w-full lg:w-[52%] flex flex-col bg-white relative">
        {/* Hamburger menu */}
        <div className="flex justify-end p-6 lg:p-8">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 xl:px-24 -mt-8 lg:-mt-12 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            <Outlet />
          </div>
        </div>

        {/* Decorative arcs — bottom right */}
        <div className="absolute bottom-0 right-0 w-44 h-44 pointer-events-none overflow-visible">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M100,12 A88,88 0 0,1 12,100" fill="none" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" />
            <path d="M100,30 A70,70 0 0,1 30,100" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
            <path d="M100,48 A52,52 0 0,1 48,100" fill="none" stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
