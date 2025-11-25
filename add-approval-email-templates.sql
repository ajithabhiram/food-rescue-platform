-- Add Email Templates for Partner Approval/Rejection
-- Run this in Supabase SQL Editor

INSERT INTO email_templates (template_key, subject, body_html, body_text, variables) VALUES

-- Partner Application Approved
('partner_approved',
'🎉 Your partner application has been approved!',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 32px;">🎉 Welcome Aboard!</h1>
</div>
<div style="padding: 40px; background: white;">
    <p style="font-size: 18px;">Hi {{partner_name}},</p>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Great news! Your partner application for <strong>{{org_name}}</strong> has been approved by our admin team.
    </p>
    
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2d6a4f;">
        <h3 style="margin-top: 0; color: #2d6a4f;">✅ You can now:</h3>
        <ul style="line-height: 2; color: #333;">
            <li>Browse available food donations in your area</li>
            <li>Accept and schedule pickups</li>
            <li>Track your impact and rescued food</li>
            <li>Connect with local donors</li>
            <li>Manage your organization profile</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="{{dashboard_link}}" style="background-color: #2d6a4f; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">Access Your Dashboard</a>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h4 style="margin-top: 0; color: #333;">📋 Application Details:</h4>
        <p style="margin: 5px 0;"><strong>Organization:</strong> {{org_name}}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
        <p style="margin: 5px 0;"><strong>Approved:</strong> {{approved_date}}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Thank you for joining our mission to reduce food waste and feed communities. Together, we''re making a real difference! 💚
    </p>
    
    <p style="font-size: 16px;">
        If you have any questions, feel free to reach out to our support team.
    </p>
    
    <p style="font-size: 16px;">
        Best regards,<br>
        <strong>Food Rescue Platform Team</strong>
    </p>
</div>
<div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="color: #666; font-size: 12px; margin: 5px 0;">Food Rescue Platform</p>
    <p style="color: #666; font-size: 12px; margin: 5px 0;">Reducing waste, feeding communities</p>
    <p style="color: #666; font-size: 12px; margin: 5px 0;">
        <a href="{{support_email}}" style="color: #2d6a4f;">Contact Support</a>
    </p>
</div>
</body></html>',
'Hi {{partner_name}},

🎉 GREAT NEWS! Your partner application has been APPROVED!

Your application for {{org_name}} has been approved by our admin team.

✅ You can now:
- Browse available food donations in your area
- Accept and schedule pickups
- Track your impact and rescued food
- Connect with local donors
- Manage your organization profile

📋 Application Details:
Organization: {{org_name}}
Email: {{email}}
Approved: {{approved_date}}

Access your dashboard: {{dashboard_link}}

Thank you for joining our mission to reduce food waste and feed communities. Together, we''re making a real difference!

If you have any questions, contact us at {{support_email}}

Best regards,
Food Rescue Platform Team

---
Food Rescue Platform - Reducing waste, feeding communities',
'{"partner_name": "Partner contact name", "org_name": "Organization name", "email": "Partner email", "approved_date": "Approval date", "dashboard_link": "Dashboard URL", "support_email": "Support email"}'::jsonb),

-- Partner Application Rejected
('partner_rejected',
'Update on your partner application',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #f8f9fa; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; border-top: 4px solid #dc3545;">
    <h1 style="margin: 0; font-size: 28px; color: #333;">Application Status Update</h1>
</div>
<div style="padding: 40px; background: white;">
    <p style="font-size: 18px;">Hi {{partner_name}},</p>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Thank you for your interest in becoming a partner with Food Rescue Platform.
    </p>
    
    <p style="font-size: 16px; line-height: 1.6;">
        After careful review, we are unable to approve your application for <strong>{{org_name}}</strong> at this time.
    </p>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
        <h3 style="margin-top: 0; color: #856404;">📝 Reason:</h3>
        <p style="color: #856404; font-size: 15px; line-height: 1.6;">
            {{rejection_reason}}
        </p>
    </div>
    
    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0066cc;">
        <h3 style="margin-top: 0; color: #004085;">💡 What you can do:</h3>
        <ul style="line-height: 2; color: #004085;">
            <li>Review the reason provided above</li>
            <li>Address any concerns or missing information</li>
            <li>Update your organization profile if needed</li>
            <li>Contact our support team for clarification</li>
            <li>Reapply once you''ve addressed the issues</li>
        </ul>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h4 style="margin-top: 0; color: #333;">📋 Application Details:</h4>
        <p style="margin: 5px 0;"><strong>Organization:</strong> {{org_name}}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
        <p style="margin: 5px 0;"><strong>Reviewed:</strong> {{reviewed_date}}</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="{{support_link}}" style="background-color: #0066cc; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">Contact Support</a>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        We appreciate your interest in our mission to reduce food waste. If you have any questions or would like to discuss your application, please don''t hesitate to reach out.
    </p>
    
    <p style="font-size: 16px;">
        Best regards,<br>
        <strong>Food Rescue Platform Team</strong>
    </p>
</div>
<div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="color: #666; font-size: 12px; margin: 5px 0;">Food Rescue Platform</p>
    <p style="color: #666; font-size: 12px; margin: 5px 0;">Reducing waste, feeding communities</p>
    <p style="color: #666; font-size: 12px; margin: 5px 0;">
        <a href="mailto:{{support_email}}" style="color: #0066cc;">{{support_email}}</a>
    </p>
</div>
</body></html>',
'Hi {{partner_name}},

Thank you for your interest in becoming a partner with Food Rescue Platform.

After careful review, we are unable to approve your application for {{org_name}} at this time.

📝 REASON:
{{rejection_reason}}

💡 WHAT YOU CAN DO:
- Review the reason provided above
- Address any concerns or missing information
- Update your organization profile if needed
- Contact our support team for clarification
- Reapply once you''ve addressed the issues

📋 Application Details:
Organization: {{org_name}}
Email: {{email}}
Reviewed: {{reviewed_date}}

We appreciate your interest in our mission. If you have questions, please contact us at {{support_email}}

Contact support: {{support_link}}

Best regards,
Food Rescue Platform Team

---
Food Rescue Platform - Reducing waste, feeding communities',
'{"partner_name": "Partner contact name", "org_name": "Organization name", "email": "Partner email", "rejection_reason": "Reason for rejection", "reviewed_date": "Review date", "support_link": "Support page URL", "support_email": "Support email"}'::jsonb);

-- Verify templates were added
SELECT template_key, subject, active 
FROM email_templates 
WHERE template_key IN ('partner_approved', 'partner_rejected');
