"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile/tablet size
 * @param breakpoint - The width in pixels to consider as mobile (default: 768px)
 * @returns boolean indicating if viewport is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
