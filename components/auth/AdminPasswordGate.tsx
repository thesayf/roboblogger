"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Clock, LogOut, Sparkles } from 'lucide-react';
import { isAdminAuthenticated, setAdminSession, clearAdminSession, getSessionTimeRemaining, verifyAdminPassword } from '@/lib/auth/adminAuth';
import Link from 'next/link';

// TEMPORARY: Set to true to bypass auth for testing
const BYPASS_AUTH = true;

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(BYPASS_AUTH);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(24);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!BYPASS_AUTH);

  // Check authentication status on mount
  useEffect(() => {
    if (BYPASS_AUTH) return;

    const checkAuth = () => {
      const authenticated = isAdminAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setTimeRemaining(getSessionTimeRemaining());
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsAuthenticated(false);
        clearAdminSession();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await verifyAdminPassword(password);

      if (isValid) {
        setAdminSession();
        setIsAuthenticated(true);
        setPassword('');
        setTimeRemaining(24);
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    setTimeRemaining(0);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Admin Header - New Brand */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">RoboBlogger</span>
                </Link>
                <div className="hidden sm:flex items-center">
                  <span className="text-slate-600 mx-3">/</span>
                  <span className="text-sm font-medium text-slate-300">Dashboard</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/blog"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  View Blog
                </Link>
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{timeRemaining}h</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content with dark background */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    );
  }

  // Login Screen - New Brand
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10">
        <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-violet-500/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-lg shadow-violet-500/25">
                <Lock className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Access</h1>
            <p className="text-slate-400">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors text-white placeholder-slate-500"
                  placeholder="Enter admin password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <p className="text-sm text-violet-300">
              <strong>Session Duration:</strong> 24 hours
            </p>
            <p className="text-xs text-violet-400/70 mt-1">
              You&apos;ll need to re-enter the password after 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
