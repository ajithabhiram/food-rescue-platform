-- Email Templates Table & Sample Templates
-- These can be edited by admins via the dashboard

CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables JSONB, -- list of available variables
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON email_templates
    FOR SELECT USING (active = TRUE OR is_admin());

CREATE POLICY "Admins can manage templates" ON email_templates
    FOR ALL USING (is_admin());

-- Insert default templates
INSERT INTO email_templates (template_key, subject, body_html, body_text, variables) VALUES

-- 1. Email Verification
('email_verification', 
'Verify your email - Food Rescue Platform',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">Welcome to Food Rescue Platform!</h2>
<p>Hi {{name}},</p>
<p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{verification_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
</div>
<p>Or copy and paste this link into your browser:</p>
<p style="color: #666; word-break: break-all;">{{verification_link}}</p>
<p>This link expires in 24 hours.</p>
<p>If you didn''t create this account, please ignore this email.</p>
<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
<p style="color: #999; font-size: 12px;">Food Rescue Platform - Reducing waste, feeding communities</p>
</body></html>',
'Hi {{name}},

Thanks for signing up for Food Rescue Platform. Please verify your email by visiting:

{{verification_link}}

This link expires in 24 hours.

If you didn''t create this account, please ignore this email.

---
Food Rescue Platform - Reducing waste, feeding communities',
'{"name": "User name", "verification_link": "Verification URL"}'::jsonb),

-- 2. New Offer Posted (to partners in zone)
('offer_posted',
'New food available for pickup - {{food_type}}',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">🍽️ New Food Available</h2>
<p>Hi {{partner_name}},</p>
<p>A new food donation is available in your area:</p>
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">{{title}}</h3>
    <p><strong>From:</strong> {{donor_name}}</p>
    <p><strong>Quantity:</strong> {{quantity}} {{unit}}</p>
    <p><strong>Type:</strong> {{food_type}}</p>
    <p><strong>Pickup Window:</strong> {{pickup_start}} - {{pickup_end}}</p>
    <p><strong>Location:</strong> {{address}}</p>
</div>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{offer_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View & Accept Offer</a>
</div>
<p style="color: #666; font-size: 14px;">First come, first served. Log in to accept this offer.</p>
</body></html>',
'Hi {{partner_name}},

New food available for pickup:

{{title}}
From: {{donor_name}}
Quantity: {{quantity}} {{unit}}
Type: {{food_type}}
Pickup: {{pickup_start}} - {{pickup_end}}
Location: {{address}}

View and accept: {{offer_link}}

---
Food Rescue Platform',
'{"partner_name": "Partner name", "title": "Offer title", "donor_name": "Donor name", "quantity": "Amount", "unit": "kg/units", "food_type": "Food category", "pickup_start": "Start time", "pickup_end": "End time", "address": "Pickup address", "offer_link": "Link to offer"}'::jsonb),

-- 3. Offer Accepted (to donor)
('offer_accepted',
'Your food donation has been accepted',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">✅ Offer Accepted!</h2>
<p>Hi {{donor_name}},</p>
<p>Great news! Your food donation has been accepted:</p>
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">{{title}}</h3>
    <p><strong>Accepted by:</strong> {{partner_name}}</p>
    <p><strong>Scheduled pickup:</strong> {{scheduled_time}}</p>
    <p><strong>Volunteer:</strong> {{volunteer_name}}</p>
</div>
<p>Please have the food ready at the scheduled time. You''ll receive a confirmation code from the volunteer.</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{assignment_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
</div>
<p>Thank you for helping reduce food waste! 🌱</p>
</body></html>',
'Hi {{donor_name}},

Your food donation has been accepted!

{{title}}
Accepted by: {{partner_name}}
Scheduled: {{scheduled_time}}
Volunteer: {{volunteer_name}}

Please have the food ready at the scheduled time.

View details: {{assignment_link}}

Thank you for reducing food waste!

---
Food Rescue Platform',
'{"donor_name": "Donor name", "title": "Offer title", "partner_name": "Partner name", "scheduled_time": "Pickup time", "volunteer_name": "Volunteer name", "assignment_link": "Link to assignment"}'::jsonb),

-- 4. Pickup Reminder (to volunteer)
('pickup_reminder',
'Reminder: Food pickup in 1 hour',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">⏰ Pickup Reminder</h2>
<p>Hi {{volunteer_name}},</p>
<p>You have a food pickup scheduled in 1 hour:</p>
<div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <p><strong>Pickup from:</strong> {{donor_name}}</p>
    <p><strong>Address:</strong> {{pickup_address}}</p>
    <p><strong>Time:</strong> {{scheduled_time}}</p>
    <p><strong>Deliver to:</strong> {{partner_name}} at {{delivery_address}}</p>
    <p><strong>OTP Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #2d6a4f;">{{otp_code}}</span></p>
</div>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{navigation_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Directions</a>
</div>
<p style="color: #666; font-size: 14px;">Use the OTP code to confirm pickup with the donor.</p>
</body></html>',
'Hi {{volunteer_name}},

Pickup reminder - in 1 hour:

Pickup from: {{donor_name}}
Address: {{pickup_address}}
Time: {{scheduled_time}}

Deliver to: {{partner_name}}
Address: {{delivery_address}}

OTP Code: {{otp_code}}

Navigation: {{navigation_link}}

---
Food Rescue Platform',
'{"volunteer_name": "Volunteer name", "donor_name": "Donor name", "pickup_address": "Pickup address", "scheduled_time": "Time", "partner_name": "Partner name", "delivery_address": "Delivery address", "otp_code": "6-digit code", "navigation_link": "Maps link"}'::jsonb),

-- 5. Pickup Completed (to all parties)
('pickup_completed',
'Food pickup completed successfully',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">✅ Pickup Completed</h2>
<p>Hi {{recipient_name}},</p>
<p>The food pickup has been completed successfully!</p>
<div style="background: #d1f2eb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2d6a4f;">
    <h3 style="margin-top: 0;">{{title}}</h3>
    <p><strong>Donor:</strong> {{donor_name}}</p>
    <p><strong>Partner:</strong> {{partner_name}}</p>
    <p><strong>Volunteer:</strong> {{volunteer_name}}</p>
    <p><strong>Completed:</strong> {{completed_time}}</p>
    <p><strong>Amount rescued:</strong> {{quantity}} {{unit}}</p>
</div>
<p style="background: #e8f5e9; padding: 15px; border-radius: 5px; text-align: center;">
    <strong>🌍 Impact:</strong> Approximately {{co2_saved}} kg CO₂ avoided!
</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{receipt_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Receipt</a>
</div>
<p>Thank you for being part of the solution! 💚</p>
</body></html>',
'Hi {{recipient_name}},

Food pickup completed successfully!

{{title}}
Donor: {{donor_name}}
Partner: {{partner_name}}
Volunteer: {{volunteer_name}}
Completed: {{completed_time}}
Amount: {{quantity}} {{unit}}

Impact: ~{{co2_saved}} kg CO₂ avoided!

View receipt: {{receipt_link}}

Thank you for reducing food waste!

---
Food Rescue Platform',
'{"recipient_name": "Recipient name", "title": "Offer title", "donor_name": "Donor name", "partner_name": "Partner name", "volunteer_name": "Volunteer name", "completed_time": "Completion time", "quantity": "Amount", "unit": "kg/units", "co2_saved": "CO2 estimate", "receipt_link": "Link to receipt"}'::jsonb),

-- 6. Account Verification Approved (for partners)
('account_verified',
'Your account has been verified',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">🎉 Account Verified!</h2>
<p>Hi {{name}},</p>
<p>Great news! Your {{role}} account has been verified by our admin team.</p>
<p>You can now access all platform features:</p>
<ul style="line-height: 1.8;">
    <li>Browse and accept food offers</li>
    <li>Schedule pickups</li>
    <li>Track your impact</li>
    <li>Connect with donors in your area</li>
</ul>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
</div>
<p>Welcome to the community! Together we''re making a difference.</p>
</body></html>',
'Hi {{name}},

Your {{role}} account has been verified!

You can now:
- Browse and accept food offers
- Schedule pickups
- Track your impact
- Connect with donors

Go to dashboard: {{dashboard_link}}

Welcome to the community!

---
Food Rescue Platform',
'{"name": "User name", "role": "User role", "dashboard_link": "Dashboard URL"}'::jsonb),

-- 7. Weekly Impact Report
('weekly_impact',
'Your weekly impact report',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2d6a4f;">📊 Your Weekly Impact</h2>
<p>Hi {{name}},</p>
<p>Here''s your impact summary for the week of {{week_start}} - {{week_end}}:</p>
<div style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
    <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; font-weight: bold;">{{total_kg}}</div>
        <div style="font-size: 18px;">kg of food rescued</div>
    </div>
    <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
            <div style="font-size: 32px; font-weight: bold;">{{pickups}}</div>
            <div>Pickups</div>
        </div>
        <div>
            <div style="font-size: 32px; font-weight: bold;">{{partners}}</div>
            <div>Partners</div>
        </div>
        <div>
            <div style="font-size: 32px; font-weight: bold;">{{co2}}</div>
            <div>kg CO₂ saved</div>
        </div>
    </div>
</div>
<p style="text-align: center; font-size: 18px; color: #2d6a4f;">
    <strong>That''s equivalent to {{meals}} meals provided! 🍽️</strong>
</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{report_link}}" style="background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Report</a>
</div>
<p>Keep up the amazing work! 💚</p>
</body></html>',
'Hi {{name}},

Your Weekly Impact Report ({{week_start}} - {{week_end}}):

🌟 {{total_kg}} kg of food rescued
📦 {{pickups}} pickups completed
🤝 {{partners}} partners served
🌍 {{co2}} kg CO₂ saved
🍽️ ~{{meals}} meals provided

View full report: {{report_link}}

Keep up the great work!

---
Food Rescue Platform',
'{"name": "User name", "week_start": "Week start date", "week_end": "Week end date", "total_kg": "Total kg", "pickups": "Number of pickups", "partners": "Number of partners", "co2": "CO2 saved", "meals": "Estimated meals", "report_link": "Report URL"}'::jsonb);
