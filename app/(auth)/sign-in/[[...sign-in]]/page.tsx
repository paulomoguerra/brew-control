"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <SignIn
        appearance={{ variables: { colorPrimary: "#8B5B3F" } }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/calculator"
      />
    </div>
  );
}
