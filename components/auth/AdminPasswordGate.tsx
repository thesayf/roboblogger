"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Clock, LogOut } from 'lucide-react';
import { isAdminAuthenticated, setAdminSession, clearAdminSession, getSessionTimeRemaining, verifyAdminPassword } from '@/lib/auth/adminAuth';

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
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
    }, 60000); // Check every minute

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        {/* Admin Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-semibold text-gray-900">Blog Admin</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{timeRemaining}h remaining</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-600/5 rounded-3xl blur-3xl"></div>
        
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-2xl shadow-blue-500/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/25">
                <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Admin Access</h1>
            <p className="text-lg text-gray-600">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 font-medium"
                  placeholder="Enter admin password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
              <div className="p-4 bg-red-50/80 border border-red-200/50 rounded-xl">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50/80 border border-blue-200/50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Session Duration:</strong> 24 hours
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You&apos;ll need to re-enter the password after 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}