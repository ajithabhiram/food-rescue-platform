# Food Rescue Platform - Setup Guide

## Quick Start (No-Code Path)

### 1. Supabase Setup (15 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization, name your project (e.g., "food-rescue-prod")
   - Set a strong database password (save it!)
   - Choose region closest to your users
   - Wait 2-3 minutes for provisioning

2. **Deploy Database Schema**
   - In Supabase dashboard, go to SQL Editor
   - Click "New Query"
   - Copy entire contents of `supabase-schema.sql`
   - Paste and click "Run"
   - Wait for success message (should take 5-10 seconds)
   - Repeat for `email-templates.sql`

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Enable "Email" provider (should be on by default)
   - Set "Site URL" to your app URL (or `http://localhost:3000` for testing)
   - Add redirect URLs for your domains
   - Enable "Email Confirmations" (recommended)
   - Set "Mailer" to "Custom SMTP" (we'll configure next)

4. **Setup Storage for Images**
   - Go to Storage
   - Create new bucket: `offer-images`
   - Set to "Public" (or configure policies for authenticated users)
   - Create bucket: `pickup-photos`
   - Set policies as needed

### 2. Google SMTP Setup (10 minutes)

**Option A: Gmail Account (for testing/low volume)**

1. Create dedicated Gmail account (e.g., `noreply@yourdomain.com`)
2. Enable 2-Factor Authentication on the account
3. Generate App Password:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Food Rescue Platform"
   - Copy the 16-character password (save it!)

4. Configure in Supabase:
   - Go to Authentication → Settings → SMTP Settings
   - Enable "Custom SMTP"
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: your Gmail address
   - Password: the 16-char app password
   - Sender email: same Gmail address
   - Sender name: "Food Rescue Platform"

**Option B: Google Workspace (recommended for production)**

1. Set up Google Workspace account
2. Create service account: `noreply@yourdomain.com`
3. Enable SMTP relay in Google Admin Console:
   - Apps → Google Workspace → Gmail → Routing
   - Add SMTP relay service
   - Allowed senders: your app's IP or domain
4. Use same SMTP settings as above with your workspace email

**Testing SMTP:**
```bash
# Test email sending via Supabase Edge Function or your app
# Send a test verification email by signing up a test user
```

### 3. No-Code Dashboard Setup

#### Option 1: Retool (Admin Dashboard)

1. **Connect to Supabase**
   - Sign up at [retool.com](https://retool.com)
   - Create new app: "Food Rescue Admin"
   - Add Resource → PostgreSQL
   - Get connection details from Supabase:
     - Settings → Database → Connection String (URI mode)
     - Host, Database, User, Password, Port
   - Test connection

2. **Build Admin Views**
   - **Users Table**: Query `SELECT * FROM users ORDER BY created_at DESC`
   - Add columns: email, name, role, verified_at, banned
   - Add actions: Edit role, Ban/Unban, View profile
   
   - **Offers Table**: Query `SELECT * FROM active_offers_view`
   - Add filters: status, date range, donor
   - Add map component showing offer locations
   
   - **KPI Dashboard**: 
     - Total rescued (kg): `SELECT SUM(rescued_kg) FROM impact_metrics`
     - Active donors: `SELECT COUNT(*) FROM users WHERE role='donor' AND NOT banned`
     - Pickups today: `SELECT pickups_count FROM impact_metrics WHERE date = CURRENT_DATE`
   
   - **Audit Log**: Query `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`

#### Option 2: Budibase (Alternative to Retool)

1. Self-host or use Budibase Cloud
2. Connect to Supabase Postgres (same connection string)
3. Auto-generate CRUD screens for each table
4. Customize forms and add business logic

#### Option 3: Bubble (Donor/Partner Dashboards)

1. **Setup**
   - Create new Bubble app
   - Install "API Connector" plugin
   - Add Supabase REST API:
     - Base URL: `https://[your-project].supabase.co/rest/v1`
     - Headers:
       - `apikey`: your Supabase anon key
       - `Authorization`: `Bearer [user-jwt-token]`

2. **Donor Flow**
   - Page: "Post Offer"
   - Form fields: title, description, quantity, food_type, pickup times, location
   - Image uploader → Supabase Storage
   - Submit → POST to `/offers`
   
   - Page: "My Offers"
   - Repeating group → GET `/offers?donor_id=eq.[user-id]`
   - Show status, edit, cancel buttons

3. **Partner Flow**
   - Page: "Browse Offers"
   - Repeating group → GET `/offers?status=eq.available`
   - Map view with markers
   - "Accept" button → POST to `/assignments`
   
   - Page: "My Pickups"
   - List of accepted assignments
   - Confirm delivery, upload photos

#### Option 4: Glide (Mobile-First App)

1. Create new Glide app
2. Connect to Supabase via REST API or Google Sheets sync
3. Build screens:
   - Home: Browse offers (cards with images)
   - Post: Simple form to create offer
   - Profile: User stats and history
4. Publish as PWA (works on any device)

### 4. Automation Setup (Make.com or Zapier)

**Scenario 1: New Offer → Notify Partners**

1. Trigger: New row in `offers` table (Supabase webhook)
2. Action: Query partners in same zone
3. Action: Send email via Google SMTP to each partner
4. Action: Create notification records

**Scenario 2: Pickup Reminder**

1. Trigger: Scheduled (every hour)
2. Action: Query assignments where scheduled_time is in 1 hour
3. Action: Send reminder email to volunteer
4. Action: Send SMS via Twilio (optional)

**Scenario 3: Daily Impact Report**

1. Trigger: Scheduled (daily at 9 AM)
2. Action: Calculate yesterday's metrics
3. Action: Insert into `impact_metrics` table
4. Action: Send summary email to admins

### 5. Environment Variables

Create `.env` file (for any custom code):

```bash
# Supabase
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Google SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Maps (optional)
MAPBOX_TOKEN=your-mapbox-token
GOOGLE_MAPS_KEY=your-google-maps-key

# Notifications (optional)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
ONESIGNAL_APP_ID=your-onesignal-id

# App
APP_URL=https://yourapp.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 6. Testing Checklist

- [ ] User can sign up and receive verification email
- [ ] Donor can create offer with image upload
- [ ] Partner can view and accept offer
- [ ] Assignment creates with OTP code
- [ ] All parties receive email notifications
- [ ] Admin can view all data in dashboard
- [ ] RLS policies prevent unauthorized access
- [ ] Image uploads work and are accessible
- [ ] Location/map features work correctly
- [ ] Impact metrics calculate correctly

### 7. Security Checklist

- [ ] RLS enabled on all tables
- [ ] Supabase anon key used in frontend (not service key!)
- [ ] SMTP credentials stored securely (not in frontend)
- [ ] Image uploads have size limits
- [ ] Rate limiting on offer creation
- [ ] Email verification required before posting
- [ ] Admin accounts use strong passwords + 2FA
- [ ] Database backups enabled (Supabase does this automatically)
- [ ] HTTPS enforced on all domains
- [ ] CORS configured correctly in Supabase

### 8. Go-Live Checklist

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Google SMTP sending limit sufficient (or upgrade to SendGrid)
- [ ] Supabase project on paid plan (if needed for volume)
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured (PostHog/GA4)
- [ ] Terms of Service & Privacy Policy pages
- [ ] GDPR compliance (if EU users)
- [ ] Onboard 3-5 pilot users (donors + partners)
- [ ] Support email/chat configured
- [ ] Backup admin account created

## Next Steps

1. **Week 1-2**: Deploy schema, configure SMTP, build admin dashboard in Retool
2. **Week 3-4**: Build donor/partner flows in Bubble or Glide
3. **Week 5**: Set up automations in Make.com
4. **Week 6**: Pilot with real users, iterate
5. **Week 7-8**: Add volunteer features, optimize flows

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Retool Docs: https://docs.retool.com
- Bubble Manual: https://manual.bubble.io
- Make.com Academy: https://www.make.com/en/academy
- Google SMTP Guide: https://support.google.com/a/answer/176600

## Troubleshooting

**Emails not sending:**
- Check SMTP credentials in Supabase
- Verify app password is correct (not regular password)
- Check Gmail "Less secure app access" (should be OFF, use app password)
- Check Supabase logs for SMTP errors

**RLS blocking queries:**
- Verify user is authenticated (check JWT token)
- Check RLS policies match your query
- Use Supabase SQL editor to test queries as specific user
- Check `auth.uid()` returns correct user ID

**Images not uploading:**
- Check Storage bucket exists and is public (or has correct policies)
- Verify file size under limit (default 50MB)
- Check CORS settings in Supabase Storage
- Verify anon key has storage permissions

**Can't connect Retool to Supabase:**
- Use "Connection String" mode, not individual fields
- Ensure IP whitelist includes Retool IPs (or disable)
- Test connection with simple query: `SELECT 1`
- Check firewall/network settings
