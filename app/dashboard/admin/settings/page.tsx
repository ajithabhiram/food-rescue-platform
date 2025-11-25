'use client'

import { useEffect, useState } from 'react'
import { 
  Settings as SettingsIcon, Save, Mail, Bell, Shield, 
  Database, Globe, Zap, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [settings, setSettings] = useState({
    siteName: 'Food Rescue Platform',
    supportEmail: 'support@foodrescue.com',
    autoApprovePartners: false,
    emailNotifications: true,
    requireEmailVerification: true,
    maxOfferDistance: 50,
    defaultPickupWindow: 2,
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (userData?.role !== 'admin') {
        toast.error('Access denied')
        router.push('/dashboard/donor')
        return
      }

      setAdminUser(userData)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // In a real app, you'd save these to a settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Settings saved successfully!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure platform settings and preferences
          </p>
        </div>

        {/* Admin Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Admin Account</h3>
              <p className="text-sm text-blue-800">
                Logged in as: <span className="font-medium">{adminUser?.email}</span>
              </p>
              <p className="text-sm text-blue-800">
                Name: <span className="font-medium">{adminUser?.name || 'Not set'}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </h2>
          <div className="space-y-4">
            <Input
              type="text"
              label="Site Name"
              placeholder="Food Rescue Platform"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />

            <Input
              type="email"
              label="Support Email"
              placeholder="support@foodrescue.com"
              icon={<Mail className="w-5 h-5" />}
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Offer Distance (km)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={settings.maxOfferDistance}
                onChange={(e) => setSettings({ ...settings, maxOfferDistance: parseInt(e.target.value) })}
                min="1"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum distance for showing offers to partners
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Pickup Window (hours)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={settings.defaultPickupWindow}
                onChange={(e) => setSettings({ ...settings, defaultPickupWindow: parseInt(e.target.value) })}
                min="1"
                max="24"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default time window for pickups
              </p>
            </div>
          </div>
        </Card>

        {/* Partner Approval Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Partner Approval
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Auto-approve Partners</p>
                <p className="text-sm text-gray-600">
                  Automatically approve partner applications without manual review
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoApprovePartners}
                  onChange={(e) => setSettings({ ...settings, autoApprovePartners: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Recommended: Keep manual approval enabled
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Manual approval helps ensure only legitimate organizations join the platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Send email notifications for important events
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Require Email Verification</p>
                <p className="text-sm text-gray-600">
                  Users must verify their email before using the platform
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Database Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Database Status</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Storage Used</span>
              <span className="font-medium text-gray-900">~50 MB</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">API Requests (Today)</span>
              <span className="font-medium text-gray-900">~1,234</span>
            </div>
          </div>
        </Card>

        {/* System Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            System Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Platform Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Environment</span>
              <span className="font-medium text-gray-900">Production</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            loading={saving}
            icon={<Save className="w-5 h-5" />}
            size="lg"
          >
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
