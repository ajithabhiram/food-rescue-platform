# 🌱 Food Rescue Platform

A production-ready, full-stack platform connecting food donors with community partners to rescue surplus food, minimize waste, and track social impact.

**Built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion, and Supabase**

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## 🎯 Vision

Connect restaurants, grocery stores, and households with shelters, food banks, and volunteers to rescue surplus food — reducing waste and feeding communities.

## 👥 User Roles

- **Admin**: Manage users, verify partners, view KPIs, configure zones
- **Donor**: Post surplus food, schedule pickups, track donation history
- **Partner/Recipient**: Accept offers, manage pickups, track inventory
- **Volunteer**: Complete pickup assignments, confirm deliveries

## 🏗️ Architecture

### Tech Stack
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Google SMTP (Gmail/Workspace)
- **No-Code Dashboards**: Retool (Admin), Bubble/Glide (Donor/Partner)
- **Automation**: Make.com or Zapier
- **Maps**: Mapbox or Google Maps
- **Hosting**: Vercel, Netlify, or Supabase Edge

### Database Schema
- `users` - Core user accounts with roles
- `donor_profiles` - Business info, location, hours
- `partner_profiles` - Organization capacity, preferences
- `offers` - Food surplus listings with pickup windows
- `assignments` - Pickup assignments with OTP verification
- `notifications` - Email/SMS/push notification log
- `audit_logs` - Admin activity tracking
- `zones` - Service area management
- `impact_metrics` - Daily rescued kg, CO₂ saved, meals provided

## ✨ Features

### 🎨 Industry-Level UI/UX
- **Smooth Animations**: Framer Motion for 60fps transitions
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Modern Components**: Buttons, cards, modals with hover effects
- **Loading States**: Professional spinners and skeletons
- **Toast Notifications**: Real-time feedback
- **Dark Mode Ready**: Easy to implement

### 🔐 Complete Authentication
- Email/password sign up and sign in
- Role-based access (Donor, Partner, Admin)
- Email verification flow
- Protected routes
- Session management

### 📦 Donor Features
- Create food offers with image upload
- Drag & drop image interface
- Set pickup windows
- Track all offers (active, completed, cancelled)
- View impact metrics (kg rescued, CO₂ saved, meals provided)
- Edit and delete offers

### 🏢 Partner Features (Coming Soon)
- Browse available offers with map view
- Accept offers and schedule pickups
- Track pickup history
- Manage organization profile

### 👨‍💼 Admin Features (Coming Soon)
- User management and verification
- Offer moderation
- Zone configuration
- Analytics dashboard
- Audit logs

## 🚀 Quick Start (20 Minutes)

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works perfectly)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (10 minutes)

**Follow the detailed guide**: [SUPABASE-SETUP.md](SUPABASE-SETUP.md)

Quick summary:
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in SQL Editor
3. Run `email-templates.sql` in SQL Editor
4. Create storage buckets: `offer-images` and `pickup-photos` (both public)
5. Get API keys from Settings → API

### 3. Configure Environment

Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 5. Create Your First Account

1. Click "Get Started"
2. Select "Donor" role
3. Fill in your details (use a real email!)
4. Check your email and verify
5. Sign in and start creating offers!

**Need help?** See [SUPABASE-SETUP.md](SUPABASE-SETUP.md) for detailed instructions with screenshots.

### 2. Configure Google SMTP (5 minutes)

1. Create dedicated Gmail account
2. Enable 2FA and generate App Password
3. Add to Supabase Auth Settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: your Gmail
   - Password: 16-char app password

### 3. Build Dashboards (No-Code)

**Admin Dashboard (Retool)**
- Connect to Supabase Postgres
- Build user management, offer moderation, KPI charts
- Add audit log viewer and zone configuration

**Donor/Partner App (Bubble or Glide)**
- Connect to Supabase REST API
- Create offer posting form with image upload
- Build offer browsing with map view
- Add pickup scheduling and confirmation

### 4. Set Up Automations (Make.com)

- **New Offer** → Notify partners in zone via email
- **Pickup Scheduled** → Send reminder 1 hour before
- **Daily** → Calculate impact metrics and send reports

## 📋 Features by Dashboard

### Admin Dashboard
✅ User management (verify, suspend, change roles)  
✅ Offer moderation and flagging  
✅ Zone configuration with geofencing  
✅ KPI wall (rescued kg, pickups, CO₂ saved)  
✅ Audit logs and activity tracking  
✅ Email template editor  
✅ CSV exports and scheduled reports  

### Donor Dashboard
✅ Create one-off or recurring offers  
✅ Upload photos and set pickup windows  
✅ Calendar view of scheduled pickups  
✅ Donation history and tax receipts  
✅ In-app messaging with partners  
✅ Impact analytics (kg donated, meals provided)  

### Partner Dashboard
✅ Browse available offers with map  
✅ Accept requests and schedule pickups  
✅ Set capacity and intake preferences  
✅ Confirm deliveries with photos  
✅ Inventory tracking and distribution log  
✅ Reporting for grants/funding  

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Email verification required
- OTP codes for pickup confirmation
- Rate limiting on offer creation
- Encrypted sensitive data
- Audit logging for admin actions
- GDPR-compliant data export/deletion

## 📊 Impact Metrics

- Total kg rescued per day/week/month
- Pickup success rate
- CO₂ emissions avoided (estimated)
- Meals provided (estimated)
- Active donors and partners
- Average time from offer to pickup

## 🗓️ MVP Roadmap (6-8 Weeks)

**Week 1**: Schema setup, SMTP config, wireframes  
**Week 2**: Admin dashboard (Retool)  
**Week 3**: Donor/partner forms (Bubble/Glide)  
**Week 4**: Email flows and automations  
**Week 5**: Maps, scheduling, volunteer assignment  
**Week 6**: Pilot testing with real users  
**Week 7-8**: Iterate, add OTP confirmation, optimize  

## 📁 Project Files

```
├── README.md                           # This file
├── SETUP-GUIDE.md                      # Detailed setup instructions
├── supabase-schema.sql                 # Database schema with RLS
├── email-templates.sql                 # Email templates table + samples
└── supabase-functions/
    ├── send-email/index.ts             # Email sending function
    └── notify-partners/index.ts        # Auto-notify partners on new offer
```

## 🛠️ Development

### Deploy Supabase Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-email
supabase functions deploy notify-partners

# Set environment variables
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-email@gmail.com
supabase secrets set SMTP_PASS=your-app-password
supabase secrets set SMTP_FROM=noreply@yourdomain.com
supabase secrets set APP_URL=https://yourapp.com
```

### Test Email Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "templateKey": "email_verification",
    "variables": {
      "name": "Test User",
      "verification_link": "https://yourapp.com/verify?token=123"
    }
  }'
```

## 🔗 Integrations

- **Stripe**: Accept donations or subscription fees
- **Twilio**: SMS notifications for urgent pickups
- **OneSignal**: Push notifications for mobile apps
- **Google Maps**: Routing and distance calculations
- **SendGrid**: Scale email beyond Gmail limits
- **PostHog**: Product analytics and user tracking
- **Sentry**: Error monitoring and debugging

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Retool Documentation](https://docs.retool.com)
- [Bubble Manual](https://manual.bubble.io)
- [Make.com Academy](https://www.make.com/en/academy)
- [Google SMTP Setup](https://support.google.com/a/answer/176600)

## 🤝 Contributing

This is a starter template. Customize for your needs:

1. Fork and modify schema for your use case
2. Add custom email templates
3. Build additional automations
4. Extend with custom Edge Functions
5. Add integrations (payment, SMS, etc.)

## 📄 License

MIT License - feel free to use for your food rescue initiative!

## 🌱 Impact

Every kg of food rescued = ~2.5 kg CO₂ avoided + ~2 meals provided

Let's reduce waste and feed communities together! 💚
# food-rescue-platform
