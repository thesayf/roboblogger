"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function MobileNavigationSheet() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAuthClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="ml-auto md:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <nav className="flex flex-col gap-4">
            <Link
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-blue-600"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              href="/blog"
            >
              Blog
            </Link>
            <Link
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-indigo-600"
              href="/about"
            >
              About
            </Link>
            <div className="flex flex-col gap-2 mt-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    size="sm"
                    onClick={handleAuthClick}
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-600"
                    size="sm"
                    onClick={handleAuthClick}
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
