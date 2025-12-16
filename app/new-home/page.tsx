"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ViewMode = 'home' | 'about';

export default function NewHomePage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navItems = [
    { label: 'Sign In', type: 'signin-trigger' as const },
    { label: 'Sign Up', href: '/sign-up', type: 'link' as const },
    { label: 'About Us', view: 'about' as ViewMode, type: 'view' as const },
    { label: 'Blog', href: '/blog', type: 'link' as const },
  ];

  // Sign-in form items (email, password, google)
  const signInFormItems = [
    { label: 'Email', type: 'input' as const, field: 'email' as const },
    { label: 'Password', type: 'input' as const, field: 'password' as const },
    { label: 'Continue with Google', type: 'google' as const },
  ];

  // Calculate total selectable items count
  const totalItems = showSignInForm ? navItems.length + signInFormItems.length : navItems.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSignInForm) {
          setShowSignInForm(false);
          setSelectedIndex(0);
          setEmail('');
          setPassword('');
        } else if (currentView !== 'home') {
          setCurrentView('home');
          setSelectedIndex(0);
        }
        return;
      }

      // Arrow down or j
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      }
      // Arrow up or k
      else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
      // Enter to select
      else if (e.key === 'Enter') {
        e.preventDefault();

        // Determine which item is selected
        if (selectedIndex === 0) {
          // Sign In - toggle expand form
          setShowSignInForm(!showSignInForm);
        } else if (showSignInForm && selectedIndex <= signInFormItems.length) {
          // One of the sign-in form items
          const formItemIndex = selectedIndex - 1;
          const formItem = signInFormItems[formItemIndex];

          if (formItem.type === 'google') {
            // Trigger Google OAuth
            console.log('Sign in with Google');
            // router.push('/api/auth/google'); // Hook up to Clerk later
          } else if (formItem.type === 'input' && (email && password)) {
            // Submit email/password form
            console.log('Sign in with email:', email, password);
            // Handle email/password sign in
          }
        } else {
          // Other nav items
          const adjustedIndex = showSignInForm ? selectedIndex - signInFormItems.length - 1 : selectedIndex;
          const selectedItem = navItems[adjustedIndex];

          if (selectedItem?.type === 'view') {
            setCurrentView(selectedItem.view);
          } else if (selectedItem?.type === 'link') {
            router.push(selectedItem.href);
          }
        }
      }
      // Type into email/password fields when selected
      else if (showSignInForm && selectedIndex > 0 && selectedIndex <= signInFormItems.length) {
        const formItemIndex = selectedIndex - 1;
        const formItem = signInFormItems[formItemIndex];

        if (formItem.type === 'input' && e.key.length === 1) {
          // Regular character
          if (formItem.field === 'email') {
            setEmail(prev => prev + e.key);
          } else if (formItem.field === 'password') {
            setPassword(prev => prev + e.key);
          }
        } else if (e.key === 'Backspace' && formItem.type === 'input') {
          e.preventDefault();
          if (formItem.field === 'email') {
            setEmail(prev => prev.slice(0, -1));
          } else if (formItem.field === 'password') {
            setPassword(prev => prev.slice(0, -1));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, router, currentView, showSignInForm, totalItems, email, password]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-mono">
      {/* Main container - same width as /app page */}
      <div className="max-w-4xl w-full mx-auto flex justify-end items-center min-h-screen">

        {currentView === 'home' ? (
          // Home view - navigation menu
          <div className="flex flex-col justify-center pr-8">

            {/* Logo - larger, single line */}
            <div className="mb-12">
              <h1 className="text-4xl text-gray-900 font-normal tracking-tight">
                Daybook
              </h1>
            </div>

            {/* Navigation list */}
            <nav className="w-80">
              <ul>
                {navItems.map((item, itemIndex) => {
                  // Calculate display index accounting for expanded form
                  const displayIndex = showSignInForm && itemIndex > 0
                    ? itemIndex + signInFormItems.length
                    : itemIndex;

                  return (
                    <React.Fragment key={item.label}>
                      <li className="mb-2">
                        <button
                          onClick={() => {
                            if (item.type === 'signin-trigger') {
                              setShowSignInForm(!showSignInForm);
                            } else if (item.type === 'view') {
                              setCurrentView(item.view);
                            } else if (item.type === 'link') {
                              router.push(item.href);
                            }
                          }}
                          onMouseEnter={() => setSelectedIndex(displayIndex)}
                          className={`block w-full text-left px-4 py-2 text-base transition-all duration-150 ${
                            selectedIndex === displayIndex
                              ? 'text-gray-900 pl-6 bg-gray-50'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {item.label}
                        </button>
                      </li>

                      {/* Show sign-in form items below Sign In */}
                      {item.type === 'signin-trigger' && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            showSignInForm ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          {signInFormItems.map((formItem, formItemIndex) => {
                            const absoluteIndex = itemIndex + formItemIndex + 1;
                            const isSelected = selectedIndex === absoluteIndex;
                            const isPasswordField = formItem.field === 'password';
                            const isGoogleOption = formItem.type === 'google';

                            return (
                              <React.Fragment key={formItem.label}>
                                <li className="mb-2">
                                  <div
                                    onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                                    className={`block px-4 py-2 text-sm transition-all duration-150 pl-12 ${
                                      isSelected
                                        ? 'text-gray-900 pl-14 bg-gray-50'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {formItem.type === 'input' ? (
                                      <div>
                                        <div className="text-xs text-gray-400 mb-1 uppercase">
                                          {formItem.label}
                                        </div>
                                        <div className="font-mono text-sm">
                                          {formItem.field === 'email' ? email || '_' : password ? '•'.repeat(password.length) || '_' : '_'}
                                          {isSelected && <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />}
                                        </div>
                                        {/* Enter hint under password */}
                                        {isPasswordField && (
                                          <div className="text-xs text-gray-400 mt-1">
                                            ↵ to sign in
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>→ {formItem.label}</div>
                                    )}
                                  </div>
                                </li>

                                {/* OR divider after password, before Google */}
                                {isPasswordField && (
                                  <li className="mb-2">
                                    <div className="pl-12 py-1">
                                      <div className="text-xs text-gray-400 text-center">
                                        OR
                                      </div>
                                    </div>
                                  </li>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </ul>
            </nav>

            {/* Keyboard hints */}
            <div className="mt-10 text-xs text-gray-400 space-y-1">
              <div>↑↓ or j/k to navigate</div>
              <div>↵ to select</div>
              {showSignInForm && <div>type to fill • esc to collapse</div>}
            </div>
          </div>
        ) : (
          // About Us view
          <div className="flex flex-col justify-center pr-8 w-full max-w-2xl">

            {/* Back indicator */}
            <div className="mb-8 text-xs text-gray-400">
              esc to go back
            </div>

            {/* About content */}
            <div className="space-y-6 text-sm leading-relaxed">
              <h2 className="text-2xl text-gray-900 font-normal mb-8">
                About Daybook
              </h2>

              <p className="text-gray-700">
                Daybook is a productivity tool built for people who value speed, efficiency, and clarity.
                No bloat. No distractions. Just a simple system to plan your day and get things done.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-900 font-medium mb-2">Fast & Keyboard-First</h3>
                  <p className="text-gray-600">
                    Built for speed. Navigate entirely with your keyboard. No mouse required.
                    Everything responds instantly.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium mb-2">Evidence-Based Methods</h3>
                  <p className="text-gray-600">
                    Combines time-blocking (Cal Newport) with GTD principles (David Allen).
                    Separate planning from execution. Stay focused on what matters today.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium mb-2">AI-Assisted Planning</h3>
                  <p className="text-gray-600">
                    Natural language task creation. AI helps you break down projects,
                    schedule blocks, and stay on track—without getting in your way.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium mb-2">Timeline + Inventory</h3>
                  <p className="text-gray-600">
                    Your timeline is what you're doing today. Your inventory is everything else.
                    Pull tasks from projects into your schedule when you're ready to work on them.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 pt-4">
                Daybook is designed for builders, makers, and anyone who wants to spend less time
                managing their tasks and more time executing them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
