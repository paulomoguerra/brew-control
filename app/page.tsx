import Link from "next/link";
import { ArrowRight, Coffee, Sparkles, ShieldCheck, Smartphone, Stars } from "lucide-react";

const features = [
  {
    title: "Universal Brewing Science",
    desc: "Dial in ratios instantly and sync recipes across devices.",
    icon: <Coffee size={18} className="text-espresso" />,
  },
  {
    title: "Sensory Lab",
    desc: "Log cupping scores and track sensory profiles over time.",
    icon: <Stars size={18} className="text-espresso" />,
  },
  {
    title: "Secure Sync",
    desc: "Your recipes and scores stay private and backed up.",
    icon: <ShieldCheck size={18} className="text-espresso" />,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    note: "Beta access",
    cta: "Create Account",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "TBD",
    note: "Advanced analytics + marketplace tools",
    cta: "Join Waitlist",
    href: "/auth",
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-caramel p-2 rounded-xl text-espresso">
              <Coffee size={22} />
            </div>
            <span className="text-lg font-black tracking-tight">Brewline</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="btn-secondary">Sign In</Link>
            <Link href="/sign-up" className="btn-primary">Create Account</Link>
          </div>
        </header>

        <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-oat text-[10px] font-black uppercase tracking-[0.3em] text-espresso">
              <Sparkles size={14} /> Brewline Beta
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tighter italic uppercase">
              Brew smarter, log faster, stay in control.
            </h1>
            <p className="mt-4 text-slate-600 font-medium text-lg">
              Brewline is a phone-first calculator and sensory lab for roasters who care about precision.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth" className="btn-primary">
                Sign In <ArrowRight size={16} />
              </Link>
              <Link href="/calculator" className="btn-secondary">
                View App
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Core Features</h2>
            <div className="mt-6 space-y-4">
              {features.map(feature => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-cream border border-oat">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{feature.title}</div>
                    <p className="text-sm text-slate-500 font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Pricing</h2>
            <span className="text-xs font-bold text-slate-500">More tiers coming soon</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricing.map(tier => (
              <div
                key={tier.name}
                className={`rounded-[2rem] p-8 border shadow-xl ${tier.highlight ? "bg-espresso text-white border-espresso" : "bg-white border-slate-200"}`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">{tier.name}</div>
                <div className="mt-4 text-3xl font-black">{tier.price}</div>
                <div className={`mt-2 text-sm ${tier.highlight ? "text-cream" : "text-slate-500"}`}>{tier.note}</div>
                <Link
                  href={tier.href}
                  className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest ${
                    tier.highlight ? "bg-cream text-espresso" : "bg-espresso text-white"
                  }`}
                >
                  {tier.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cream border border-oat rounded-xl text-espresso">
              <Smartphone size={18} />
            </div>
            <h3 className="text-lg font-black">Add Brewline to your Home Screen</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 font-medium">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">iOS</div>
              <p className="mt-2">Tap Share → “Add to Home Screen.” Launch Brewline like an app.</p>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Android</div>
              <p className="mt-2">Open the browser menu → “Add to Home Screen” or “Install app.”</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
