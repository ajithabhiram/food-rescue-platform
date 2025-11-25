'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Package, TrendingUp, AlertCircle, 
  CheckCircle, Clock, Leaf, Activity 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate, calculateCO2Saved, calculateMeals } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalPartners: 0,
    pendingPartners: 0,
    totalOffers: 0,
    activeOffers: 0,
    completedOffers: 0,
    totalKgRescued: 0,
    co2Saved: 0,
    mealsProvided: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [pendingApplications, setPendingApplications] = useState<any[]>([])

  useEffect(() => {
    checkAdminAccess()
    loadDashboardData()
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
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (userData?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.')
        router.push('/dashboard/donor')
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/auth/login')
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load users stats
      const { data: users } = await supabase
        .from('users')
        .select('role, approved, created_at')

      const totalUsers = users?.length || 0
      const totalDonors = users?.filter(u => u.role === 'donor').length || 0
      const totalPartners = users?.filter(u => u.role === 'partner' && u.approved).length || 0
      const pendingPartners = users?.filter(u => u.role === 'partner' && !u.approved).length || 0

      // Load offers stats
      const { data: offers } = await supabase
        .from('offers')
        .select('status, quantity_est, created_at')

      const totalOffers = offers?.length || 0
      const activeOffers = offers?.filter(o => o.status === 'available').length || 0
      const completedOffers = offers?.filter(o => o.status === 'delivered').length || 0
      const totalKgRescued = offers?.reduce((sum, o) => sum + (o.quantity_est || 0), 0) || 0

      setStats({
        totalUsers,
        totalDonors,
        totalPartners,
        pendingPartners,
        totalOffers,
        activeOffers,
        completedOffers,
        totalKgRescued,
        co2Saved: calculateCO2Saved(totalKgRescued),
        mealsProvided: calculateMeals(totalKgRescued),
      })

      // Load pending partner applications
      const { data: pending } = await supabase
        .from('users')
        .select('*, partner_profiles(org_name, address)')
        .eq('role', 'partner')
        .eq('approved', false)
        .order('created_at', { ascending: false })
        .limit(5)

      setPendingApplications(pending || [])

      // Load recent activity (last 10 offers)
      const { data: recentOffers } = await supabase
        .from('offers')
        .select('*, users!donor_id(name)')
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentActivity(recentOffers || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading admin dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              System overview and management controls
            </p>
          </div>
          {stats.pendingPartners > 0 && (
            <Button
              onClick={() => router.push('/dashboard/admin/applications')}
              variant="primary"
              icon={<AlertCircle className="w-5 h-5" />}
            >
              {stats.pendingPartners} Pending Applications
            </Button>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalDonors} donors • {stats.totalPartners} partners
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Pending Applications</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingPartners}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Partner applications
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOffers}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats.activeOffers} active • {stats.completedOffers} completed
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Food Rescued</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalKgRescued.toFixed(0)} kg</p>
                  <p className="text-sm text-primary-600 mt-1">
                    {stats.mealsProvided} meals provided
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Impact Stats */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            Environmental Impact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats.co2Saved.toFixed(0)} kg</p>
              <p className="text-sm text-gray-600 mt-1">CO₂ Emissions Saved</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{stats.mealsProvided}</p>
              <p className="text-sm text-gray-600 mt-1">Meals Provided</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{stats.totalKgRescued.toFixed(0)} kg</p>
              <p className="text-sm text-gray-600 mt-1">Food Waste Prevented</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/applications')}
              className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left relative"
            >
              {stats.pendingPartners > 0 && (
                <span className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {stats.pendingPartners}
                </span>
              )}
              <Clock className="w-8 h-8 text-yellow-600 mb-2" />
              <p className="font-medium text-gray-900">Applications</p>
              <p className="text-sm text-gray-600">Review partners</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/users')}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Users</p>
              <p className="text-sm text-gray-600">Manage users</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/offers')}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Offers</p>
              <p className="text-sm text-gray-600">View all offers</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/analytics')}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <Activity className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">View reports</p>
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Applications */}
          {pendingApplications.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Pending Applications</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/admin/applications')}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{app.name}</p>
                        <p className="text-sm text-gray-600">{app.email}</p>
                        {app.partner_profiles?.[0]?.org_name && (
                          <p className="text-sm text-gray-600 mt-1">
                            Org: {app.partner_profiles[0].org_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {formatDate(app.created_at)}
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{offer.title}</p>
                      <p className="text-sm text-gray-600">
                        by {offer.users?.name || 'Anonymous'} • {formatDate(offer.created_at)}
                      </p>
                    </div>
                    <Badge variant={offer.status === 'available' ? 'success' : 'default'}>
                      {offer.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
