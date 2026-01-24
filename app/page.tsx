"use client";

import React from "react";
import Link from "next/link";
import { 
  Coffee, 
  LayoutDashboard, 
  ShoppingBag, 
  Book, 
  Flame, 
  Database, 
  Award, 
  Calculator, 
  Settings,
  ArrowRight,
  TrendingUp,
  QrCode,
  CheckCircle2,
  Zap,
  LayoutGrid,
  Users
} from "lucide-react";
import { useUnits } from "../lib/units";

const PlanFeature = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3">
    <div className="bg-green-100 text-green-600 p-0.5 rounded-full flex-shrink-0">
      <CheckCircle2 size={14} />
    </div>
    <span className="text-xs font-bold text-slate-600">{text}</span>
  </li>
);

export default function LandingPage() {
  const { t, formatCurrency } = useUnits();

  const sections = [
    {
      title: "Executive Dashboard",
      desc: "Real-time financial visibility, predictive analytics, and consistency tracking.",
      icon: <LayoutDashboard size={40} className="text-blue-500" />,
      href: "/dashboard"
    },
    {
      title: "Client Intelligence",
      desc: "Predictive CRM for wholesale partners. Stock alerts and order suggestions.",
      icon: <Users size={40} className="text-purple-500" />,
      href: "/clients"
    },
    {
      title: "Sales Hub",
      desc: "Multi-channel distribution, B2B order orchestration, and revenue tracking.",
      icon: <ShoppingBag size={40} className="text-orange-500" />,
      href: "/sales"
    },

    {
      title: "Sales Hub",
      desc: "Multi-channel distribution, B2B order orchestration, and revenue tracking.",
      icon: <ShoppingBag size={40} className="text-orange-500" />,
      href: "/sales"
    },
    {
      title: "Brewing Lab",
      desc: "Precision recipes, expert tips, and a digital whiteboard for your cafe floor.",
      icon: <Book size={40} className="text-amber-600" />,
      href: "/recipes"
    },
    {
      title: "Production Hub",
      desc: "Log roast batches, track shrinkage, and calculate true production costs per unit.",
      icon: <Flame size={40} className="text-red-500" />,
      href: "/roast"
    },
    {
      title: "Green Inventory",
      desc: "Raw stock management with automated burn-down charts and reorder alerts.",
      icon: <Database size={40} className="text-emerald-500" />,
      href: "/inventory"
    },
    {
      title: "Sensory Lab",
      desc: "SCA-standard cupping sessions, searchable flavor wheel, and quality analysis.",
      icon: <Award size={40} className="text-purple-500" />,
      href: "/quality"
    },
    {
      title: "Public Traceability",
      desc: "Generate QR codes for your bags. Share the story of the bean with your customers.",
      icon: <QrCode size={40} className="text-pink-500" />,
      href: "/traceability"
    },
    {
      title: "Precision Tools",
      desc: "Advanced brewing science and roasting economics calculators.",
      icon: <Calculator size={40} className="text-slate-600" />,
      href: "/calculator"
    },
    {
      title: "App Configuration",
      desc: "Manage localization, currency, units, and external ERP integration settings.",
      icon: <Settings size={40} className="text-slate-400" />,
      href: "/settings"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg text-slate-900">
              <Coffee size={20} />
            </div>
            <span className="text-lg font-black tracking-tight uppercase italic text-slate-900">RoasterOS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Help
            </Link>
            <Link href="/settings" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        
        {/* BIG CARD: MEMBERSHIP & PLANS (Now at the top) */}
        <div className="mb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Roaster Command Center</h1>
            <p className="text-slate-500 font-medium mt-1">Scale your production with precision-engineered tools.</p>
          </div>

          <div className="border border-slate-200 rounded-[2rem] bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-8 md:p-12 text-white">
                <div className="flex items-center gap-3 text-amber-500 mb-4 font-black uppercase tracking-[0.2em] text-xs">
                  <Zap size={20} /> Membership & Growth Plans
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Scale your roastery with RoasterOS</h2>
                <p className="text-slate-400 mt-4 max-w-2xl font-medium text-lg">Choose the right plan for your current production volume. Upgrade or downgrade at any time as your business evolves.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* hobbyist */}
                <div className="p-8 md:p-10 space-y-8">
                  <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Hobbyist</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black text-slate-900">Free</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 italic">Perfect for home labs</p>
                  </div>
                  <ul className="space-y-4">
                      <PlanFeature text="Roast Logging" />
                      <PlanFeature text="Recipe Library" />
                      <PlanFeature text="Basic Calculator" />
                  </ul>
                  <button className="w-full py-4 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Current Plan</button>
                </div>

                {/* starter */}
                <div className="p-8 md:p-10 space-y-8 bg-slate-50/30">
                  <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Starter</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black text-slate-900">$29</span>
                        <span className="text-slate-400 font-bold">/mo</span>
                      </div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-4 italic">For garage startups</p>
                  </div>
                  <ul className="space-y-4">
                      <PlanFeature text="Inventory Tracking" />
                      <PlanFeature text="True Cost Analysis" />
                      <PlanFeature text="Wholesale Orders" />
                      <PlanFeature text="500 lbs/mo Limit" />
                  </ul>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">Upgrade to Starter</button>
                </div>

                {/* pro */}
                <div className="p-8 md:p-10 space-y-8">
                  <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Pro</h3>
                        <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Power User</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black text-slate-900">$79</span>
                        <span className="text-slate-400 font-bold">/mo</span>
                      </div>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-4 italic">High volume roasteries</p>
                  </div>
                  <ul className="space-y-4">
                      <PlanFeature text="ERP Integrations (Bling, Shopify)" />
                      <PlanFeature text="Public Traceability Pages" />
                      <PlanFeature text="Advanced Unit Economics" />
                      <PlanFeature text="Unlimited Production" />
                      <PlanFeature text="Multi-User Access" />
                  </ul>
                  <button className="w-full py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all">Get Pro Access</button>
                </div>
            </div>
          </div>
        </div>

        {/* Command Center Grid (Now at the bottom) */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <LayoutGrid size={24} className="text-slate-400" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Command Center Modules</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map((section, idx) => (
              <Link 
                key={idx} 
                href={section.href}
                className="flex items-start gap-5 p-6 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="shrink-0 pt-1">
                  {section.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {section.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Banner */}
        <div className="mt-16 p-8 bg-slate-100 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white rounded-3xl shadow-sm"><TrendingUp size={32} className="text-slate-900" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Need Enterprise Solutions?</h2>
              <p className="text-slate-500 font-medium">Custom API access and dedicated support for multi-location roasteries.</p>
            </div>
          </div>
          <Link 
            href="/dashboard" 
            className="whitespace-nowrap bg-white border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all active:scale-95"
          >
            Contact Sales
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 mt-12 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <Coffee size={16} />
            <span className="font-black tracking-tight text-xs uppercase italic">RoasterOS Inc.</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
