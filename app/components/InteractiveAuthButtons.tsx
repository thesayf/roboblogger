"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function InteractiveAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignUpButton mode="modal">
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            size="sm"
          >
            Sign Up
          </Button>
        </SignUpButton>
        <SignInButton mode="modal">
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-600"
            size="sm"
          >
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
