'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Building, Mail, Phone, MapPin, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function DonorProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    openingHours: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user data - use maybeSingle to avoid errors
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      // If user doesn't exist, use auth data (trigger should create it)
      const userInfo = userData || {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: authUser.user_metadata?.role || 'donor',
        created_at: authUser.created_at,
        verified_at: authUser.email_confirmed_at,
      }

      setUser(userInfo)

      // Get donor profile separately
      const { data: donorProfile } = await supabase
        .from('donor_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      setFormData({
        name: userInfo.name || authUser.user_metadata?.name || '',
        email: authUser.email || '',
        phone: userInfo.phone || '',
        businessName: donorProfile?.business_name || '',
        address: donorProfile?.address || '',
        city: donorProfile?.city || '',
        openingHours: donorProfile?.opening_hours 
          ? JSON.stringify(donorProfile.opening_hours)
          : '',
      })
    } catch (error: any) {
      console.error('Error loading profile:', error)
      // Fallback to auth user data
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'donor',
          created_at: authUser.created_at,
        })
        setFormData({
          name: authUser.user_metadata?.name || '',
          email: authUser.email || '',
          phone: '',
          businessName: '',
          address: '',
          city: '',
          openingHours: '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
        })
        .eq('id', authUser.id)

      if (userError) throw userError

      // Check if donor profile exists
      const { data: existingProfile } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle()

      // Update or create donor profile
      if (existingProfile) {
        const { error: profileError } = await supabase
          .from('donor_profiles')
          .update({
            business_name: formData.businessName,
            address: formData.address,
            city: formData.city,
            opening_hours: formData.openingHours ? JSON.parse(formData.openingHours) : null,
          })
          .eq('user_id', authUser.id)

        if (profileError) throw profileError
      } else {
        const { error: profileError } = await supabase
          .from('donor_profiles')
          .insert({
            user_id: authUser.id,
            business_name: formData.businessName,
            address: formData.address,
            city: formData.city,
            opening_hours: formData.openingHours ? JSON.parse(formData.openingHours) : null,
          })

        if (profileError) throw profileError
      }

      toast.success('Profile updated successfully!')
      loadProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="donor">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="donor">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                icon={<User className="w-5 h-5" />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                value={formData.email}
                disabled
              />

              <Input
                type="tel"
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                icon={<Phone className="w-5 h-5" />}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </Card>

          {/* Business Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </h2>
            <div className="space-y-4">
              <Input
                type="text"
                label="Business Name"
                placeholder="Your Restaurant or Store"
                icon={<Building className="w-5 h-5" />}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />

              <Input
                type="text"
                label="Address"
                placeholder="123 Main Street"
                icon={<MapPin className="w-5 h-5" />}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <Input
                type="text"
                label="City"
                placeholder="San Francisco"
                icon={<MapPin className="w-5 h-5" />}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Hours (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder='{"mon": "9-17", "tue": "9-17", "wed": "9-17"}'
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON format for opening hours
                </p>
              </div>
            </div>
          </Card>

          {/* Account Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Verified</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.verified_at ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {user?.banned ? 'Suspended' : 'Active'}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              loading={saving}
              icon={<Save className="w-5 h-5" />}
              size="lg"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={loadProfile}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
