import Link from "next/link";
import { Coffee, Sparkles } from "lucide-react";

export default function AuthLandingPage() {
  return (
    <div className="min-h-screen bg-cream text-slate-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-oat text-espresso font-black text-[10px] uppercase tracking-[0.25em]">
            <Coffee size={14} /> Brewline
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-tighter italic uppercase">
            Welcome Back
          </h1>
          <p className="mt-3 text-slate-500 font-medium">
            Sign in to sync your recipes or create an account to start brewing smarter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-cream text-espresso border border-oat">
                <Coffee size={18} />
              </div>
              <h2 className="text-xl font-black">Sign In</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Access your saved recipes and keep everything synced across devices.
            </p>
            <Link href="/sign-in" className="btn-primary w-full">
              Sign In
            </Link>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-cream text-espresso border border-oat">
                <Sparkles size={18} />
              </div>
              <h2 className="text-xl font-black">Create Account</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Start fresh with Brewline and save every brew directive you dial in.
            </p>
            <Link href="/sign-up" className="btn-secondary w-full">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
