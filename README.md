# RoasterOS

Finance-first ERP for coffee micro-roasters. Track green inventory, production costs, wholesale orders, and cafe profitability.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Convex](https://img.shields.io/badge/Convex-Backend-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

### Inventory & Production
- **Green Inventory Management** - Track batches, costs, and stock levels
- **Blend Designer** - Create recipes with precise percentages
- **Production Log** - Calculate true roast costs including shrinkage, labor, and overhead
- **Quality Control** - SCA-standard cupping with value matrix analysis

### Sales & Revenue
- **Wholesale Orders** - B2B order management with automatic inventory deduction
- **Cafe Operations** - True-cost menu analysis with ingredient tracking
- **Executive Dashboard** - Real-time financial metrics and predictive analytics

### Key Differentiators
- **True Cost Calculation** - Factors in shrinkage, labor, gas, and packaging
- **Metric System Support** - Toggle between kg/USD and lbs/USD
- **Real-time Updates** - Powered by Convex for instant data synchronization
- **Mobile Responsive** - Access from any device

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Convex (relational database with real-time sync)
- **Charts:** Recharts
- **Icons:** Lucide React

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start Convex backend (in one terminal)
npx convex dev

# Start Next.js dev server (in another terminal)
npm run dev
```

Visit `http://localhost:3000`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**
```bash
# Deploy Convex backend
npx convex deploy

# Deploy to Vercel
vercel --prod
```

Your app will be live at: `https://your-app.vercel.app`

## Environment Variables

Create `.env.local` for local development:
```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Project Structure

```
roasteros/
├── app/                  # Next.js pages
│   ├── dashboard/       # Executive dashboard
│   ├── inventory/       # Green coffee inventory
│   ├── roast/          # Production logging
│   ├── recipes/        # Blend designer
│   ├── quality/        # Cupping & QC
│   ├── sales/          # Wholesale orders
│   └── cafe/           # Cafe profitability
├── components/         # Reusable UI components
├── convex/            # Backend functions
└── lib/               # Utilities
```

## Support

Built with ☕ for coffee roasters who care about their margins.
