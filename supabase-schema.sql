-- Food Surplus Rescue Platform - Supabase Schema
-- Deploy this via Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geolocation (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'donor', 'partner', 'volunteer');
CREATE TYPE offer_status AS ENUM ('available', 'accepted', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'donor',
    verified_at TIMESTAMPTZ,
    banned BOOLEAN DEFAULT FALSE,
    approved BOOLEAN, -- NULL = pending, TRUE = approved, FALSE = rejected
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    application_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donor profiles
CREATE TABLE donor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT,
    address TEXT,
    city TEXT,
    location GEOGRAPHY(POINT, 4326), -- lat/lon using PostGIS
    zone_id UUID,
    opening_hours JSONB, -- e.g., {"mon": "9-17", "tue": "9-17"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner/Recipient profiles
CREATE TABLE partner_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    location GEOGRAPHY(POINT, 4326),
    zone_id UUID,
    capacity_info JSONB, -- e.g., {"max_kg_per_day": 100}
    collection_prefs JSONB, -- e.g., {"preferred_times": ["14:00-16:00"]}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer profiles (optional)
CREATE TABLE volunteer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    max_capacity_kg NUMERIC,
    available_zones UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service zones
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    geojson JSONB, -- GeoJSON polygon
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food offers
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    quantity_est NUMERIC, -- kg or units
    quantity_unit TEXT DEFAULT 'kg',
    food_type TEXT, -- e.g., "produce", "prepared", "packaged"
    pickup_window_start TIMESTAMPTZ NOT NULL,
    pickup_window_end TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    status offer_status DEFAULT 'available',
    image_path TEXT, -- Supabase Storage path
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments (pickup assignments)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id), -- who accepted
    volunteer_id UUID REFERENCES users(id), -- who picks up
    scheduled_time TIMESTAMPTZ,
    status assignment_status DEFAULT 'pending',
    otp_code TEXT, -- 6-digit OTP for verification
    pickup_photos TEXT[], -- array of storage paths
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type DEFAULT 'email',
    subject TEXT,
    payload JSONB, -- flexible notification data
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impact metrics (materialized or computed)
CREATE TABLE impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    rescued_kg NUMERIC DEFAULT 0,
    pickups_count INTEGER DEFAULT 0,
    donors_count INTEGER DEFAULT 0,
    partners_count INTEGER DEFAULT 0,
    co2_avoided_kg NUMERIC DEFAULT 0, -- simple multiplier
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_offers_donor ON offers(donor_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_pickup_window ON offers(pickup_window_start, pickup_window_end);
CREATE INDEX idx_assignments_offer ON assignments(offer_id);
CREATE INDEX idx_assignments_partner ON assignments(partner_id);
CREATE INDEX idx_assignments_volunteer ON assignments(volunteer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Spatial indexes for location queries
CREATE INDEX idx_donor_location ON donor_profiles USING GIST(location);
CREATE INDEX idx_partner_location ON partner_profiles USING GIST(location);
CREATE INDEX idx_offer_location ON offers USING GIST(location);

-- ============================================
-- TRIGGERS (auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER donor_profiles_updated_at BEFORE UPDATE ON donor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER partner_profiles_updated_at BEFORE UPDATE ON partner_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can do everything on users" ON users
    FOR ALL USING (is_admin());

-- Donor profiles policies
CREATE POLICY "Donors can view their own profile" ON donor_profiles
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Donors can update their own profile" ON donor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Donors can insert their own profile" ON donor_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Partner profiles policies
CREATE POLICY "Partners can view their own profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Partners can update their own profile" ON partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Partners can insert their own profile" ON partner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Zones policies (public read, admin write)
CREATE POLICY "Anyone can view active zones" ON zones
    FOR SELECT USING (active = TRUE OR is_admin());

CREATE POLICY "Admins can manage zones" ON zones
    FOR ALL USING (is_admin());

-- Offers policies
CREATE POLICY "Anyone authenticated can view available offers" ON offers
    FOR SELECT USING (status = 'available' OR donor_id = auth.uid() OR is_admin());

CREATE POLICY "Donors can create offers" ON offers
    FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own offers" ON offers
    FOR UPDATE USING (auth.uid() = donor_id OR is_admin());

CREATE POLICY "Donors can delete their own offers" ON offers
    FOR DELETE USING (auth.uid() = donor_id OR is_admin());

-- Assignments policies
CREATE POLICY "Users can view their own assignments" ON assignments
    FOR SELECT USING (
        partner_id = auth.uid() OR 
        volunteer_id = auth.uid() OR 
        is_admin() OR
        EXISTS (SELECT 1 FROM offers WHERE offers.id = assignments.offer_id AND offers.donor_id = auth.uid())
    );

CREATE POLICY "Partners can create assignments" ON assignments
    FOR INSERT WITH CHECK (auth.uid() = partner_id OR is_admin());

CREATE POLICY "Participants can update assignments" ON assignments
    FOR UPDATE USING (
        partner_id = auth.uid() OR 
        volunteer_id = auth.uid() OR 
        is_admin()
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (is_admin());

-- Impact metrics (public read)
CREATE POLICY "Anyone can view impact metrics" ON impact_metrics
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage impact metrics" ON impact_metrics
    FOR ALL USING (is_admin());

-- ============================================
-- FUNCTIONS & VIEWS
-- ============================================

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- View: Active offers with donor info
CREATE OR REPLACE VIEW active_offers_view AS
SELECT 
    o.*,
    u.name as donor_name,
    dp.business_name,
    dp.address as donor_address,
    ST_Y(o.location::geometry) as latitude,
    ST_X(o.location::geometry) as longitude
FROM offers o
JOIN users u ON o.donor_id = u.id
LEFT JOIN donor_profiles dp ON u.id = dp.user_id
WHERE o.status = 'available' 
    AND o.pickup_window_end > NOW();

-- Function to calculate distance between two points (in km)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1000; -- convert meters to km
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTH TRIGGER (auto-create user profile)
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'donor');
  
  INSERT INTO public.users (id, email, name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    user_role,
    -- Auto-approve donors, admins, and volunteers. Partners start as NULL (pending).
    CASE WHEN user_role = 'partner' THEN NULL ELSE TRUE END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA (optional - for testing)
-- ============================================

-- Insert default admin zone
INSERT INTO zones (name, active) VALUES ('Default Zone', TRUE);
