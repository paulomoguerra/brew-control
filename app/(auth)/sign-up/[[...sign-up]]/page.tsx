"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <SignUp
        appearance={{ variables: { colorPrimary: "#8B5B3F" } }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/calculator"
      />
    </div>
  );
}
