"use client";

import React from "react";
import Link from "next/link";
import { Coffee, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export default function LandingPage() {
  
  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl text-slate-900">
              <Coffee size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">RoasterOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard"
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-xs font-black uppercase tracking-widest mb-8">
            <TrendingUp size={14} />
            Finance-First Coffee ERP
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-tight">
            Cropster controls your roast. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              We control your bank account.
            </span>
          </h1>
          <p className="text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop roasting blind. RoasterOS tracks your green inventory, calculates true shrinkage costs, and manages wholesale orders in one unified dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <Link 
              href="/calculator"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:shadow-lg"
            >
              Try Cost Calculator
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-amber-200/40 to-orange-100/40 rounded-full blur-[100px] -z-10" />
      </section>

      {/* Value Props Grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Why Roasters Switch</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Most micro-roasters fail because they don't know their margins. We fix that.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} className="text-blue-500" />}
              title="True Cost Tracking"
              desc="We factor in moisture loss (shrinkage), shipping, and labor to tell you exactly what that bag of coffee costs."
            />
            <FeatureCard 
              icon={<TrendingUp size={32} className="text-green-500" />}
              title="Predictive Inventory"
              desc="Never run out of green coffee. Our burn-down charts predict exactly when you'll need to reorder based on production velocity."
            />
            <FeatureCard 
              icon={<Coffee size={32} className="text-amber-500" />}
              title="Wholesale Portal"
              desc="Give your cafes a professional login to order beans. Inventory is deducted automatically as orders are placed."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16 max-w-2xl mx-auto">
             <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Simple, Transparent Pricing</h2>
             <p className="text-slate-500 font-medium text-lg">
               Start for free, upgrade as you grow. We only make money when you make money.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
             
             {/* Tier 1: Hobbyist */}
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="mb-4">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Hobbyist</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                   <span className="text-4xl font-black text-slate-900 tracking-tighter">Free</span>
                </div>
                <p className="text-slate-500 font-medium mb-8 text-sm">For home roasters perfecting their craft.</p>
                <Link href="/dashboard" className="block w-full py-3 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors text-center mb-8">
                  Get Started
                </Link>
                <ul className="space-y-3">
                  <PricingCheck text="Roast Logging" />
                  <PricingCheck text="Recipe Library" />
                  <PricingCheck text="Community Access" />
                  <li className="flex items-center gap-3 opacity-50">
                    <div className="text-slate-300"><XCircle size={16} /></div>
                    <span className="font-medium text-slate-400 text-sm decoration-slate-300">Inventory Tracking</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                     <div className="text-slate-300"><XCircle size={16} /></div>
                     <span className="font-medium text-slate-400 text-sm decoration-slate-300">Wholesale Portal</span>
                  </li>
                </ul>
             </div>

             {/* Tier 2: Starter */}
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all relative">
                <div className="mb-4">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Starter</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                   <span className="text-4xl font-black text-slate-900 tracking-tighter">$29</span>
                   <span className="text-slate-400 font-medium">/mo</span>
                </div>
                <p className="text-slate-500 font-medium mb-8 text-sm">For garage startups processing &lt;500lbs.</p>
                <Link href="/dashboard" className="block w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-center mb-8">
                  Start Free Trial
                </Link>
                <ul className="space-y-3">
                  <PricingCheck text="Green Inventory Management" />
                  <PricingCheck text="Roast Production Logs" />
                  <PricingCheck text="Basic Cost Calculator" />
                  <PricingCheck text="500 lbs/mo Limit" />
                  <li className="flex items-center gap-3 opacity-50">
                     <div className="text-slate-300"><XCircle size={16} /></div>
                     <span className="font-medium text-slate-400 text-sm decoration-slate-300">Wholesale Portal</span>
                  </li>
                </ul>
             </div>

             {/* Tier 3: Pro (Highlighted) */}
             <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden transform md:-translate-y-4 border border-slate-700">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Coffee size={120} />
                </div>
                <div className="relative z-10">
                  <div className="mb-4 flex justify-between items-center">
                    <span className="bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Pro</span>
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Best Value</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                     <span className="text-5xl font-black tracking-tighter">$79</span>
                     <span className="text-slate-400 font-medium">/mo</span>
                  </div>
                  <p className="text-slate-400 font-medium mb-8 text-sm">For micro-roasteries scaling up.</p>
                  <Link href="/dashboard" className="block w-full py-4 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors text-center mb-8 shadow-lg shadow-amber-500/20">
                    Get Full Access
                  </Link>
                  <ul className="space-y-3">
                    <PricingCheck text="Unlimited Inventory & Roasting" light />
                    <PricingCheck text="Wholesale Order Portal" light />
                    <PricingCheck text="QuickBooks & Shopify Sync" light />
                    <PricingCheck text="Advanced Unit Economics" light />
                    <PricingCheck text="Multi-User Admin" light />
                  </ul>
                </div>
             </div>

           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <div className="bg-slate-900 p-1.5 rounded-lg text-white">
              <Coffee size={16} />
            </div>
            <span className="font-black tracking-tight text-slate-900">RoasterOS</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            © 2024 RoasterOS Inc. Built for profit-first roasters.
          </p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit border border-slate-100">{icon}</div>
    <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium text-sm">{desc}</p>
  </div>
);

const PricingCheck = ({ text, light }: { text: string, light?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`${light ? 'bg-white/10 text-amber-500' : 'bg-green-50 text-green-600'} p-1 rounded-full`}>
      <CheckCircle2 size={14} />
    </div>
    <span className={`font-bold text-sm ${light ? 'text-slate-200' : 'text-slate-700'}`}>{text}</span>
  </div>
);
