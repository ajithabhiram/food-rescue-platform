'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, Users, Package, Leaf, Calendar,
  Download, BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { calculateCO2Saved, calculateMeals } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalOffers: 0,
    completedOffers: 0,
    totalKgRescued: 0,
    co2Saved: 0,
    mealsProvided: 0,
    topDonors: [] as any[],
    topPartners: [] as any[],
    recentActivity: [] as any[],
  })

  useEffect(() => {
    checkAdminAccess()
    loadAnalytics()
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
        toast.error('Access denied')
        router.push('/dashboard/donor')
        return
      }
    } catch (error) {
      router.push('/auth/login')
    }
  }

  const loadAnalytics = async () => {
    try {
      // Load users
      const { data: users } = await supabase
        .from('users')
        .select('created_at')

      const totalUsers = users?.length || 0
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      const newUsersThisMonth = users?.filter(u => 
        new Date(u.created_at) > oneMonthAgo
      ).length || 0

      // Load offers
      const { data: offers } = await supabase
        .from('offers')
        .select('status, quantity_est, donor_id')

      const totalOffers = offers?.length || 0
      const completedOffers = offers?.filter(o => o.status === 'delivered').length || 0
      const totalKgRescued = offers?.reduce((sum, o) => sum + (o.quantity_est || 0), 0) || 0

      // Top donors
      const donorStats = offers?.reduce((acc: any, offer) => {
        if (!acc[offer.donor_id]) {
          acc[offer.donor_id] = { count: 0, kg: 0 }
        }
        acc[offer.donor_id].count++
        acc[offer.donor_id].kg += offer.quantity_est || 0
        return acc
      }, {})

      const topDonorIds = Object.entries(donorStats || {})
        .sort((a: any, b: any) => b[1].kg - a[1].kg)
        .slice(0, 5)
        .map(([id]) => id)

      const { data: topDonorsData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', topDonorIds)

      const topDonors = topDonorsData?.map(donor => ({
        ...donor,
        ...donorStats[donor.id]
      })) || []

      // Top partners
      const { data: assignments } = await supabase
        .from('assignments')
        .select('partner_id, status')

      const partnerStats = assignments?.reduce((acc: any, assignment) => {
        if (!acc[assignment.partner_id]) {
          acc[assignment.partner_id] = { count: 0, completed: 0 }
        }
        acc[assignment.partner_id].count++
        if (assignment.status === 'completed') {
          acc[assignment.partner_id].completed++
        }
        return acc
      }, {})

      const topPartnerIds = Object.entries(partnerStats || {})
        .sort((a: any, b: any) => b[1].completed - a[1].completed)
        .slice(0, 5)
        .map(([id]) => id)

      const { data: topPartnersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', topPartnerIds)

      const topPartners = topPartnersData?.map(partner => ({
        ...partner,
        ...partnerStats[partner.id]
      })) || []

      setStats({
        totalUsers,
        newUsersThisMonth,
        totalOffers,
        completedOffers,
        totalKgRescued,
        co2Saved: calculateCO2Saved(totalKgRescued),
        mealsProvided: calculateMeals(totalKgRescued),
        topDonors,
        topPartners,
        recentActivity: [],
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    const csvData = `
Total Users,${stats.totalUsers}
New Users This Month,${stats.newUsersThisMonth}
Total Offers,${stats.totalOffers}
Completed Offers,${stats.completedOffers}
Total Food Rescued (kg),${stats.totalKgRescued}
CO2 Saved (kg),${stats.co2Saved}
Meals Provided,${stats.mealsProvided}
    `.trim()

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Data exported successfully')
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading analytics..." />
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
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">
              Platform insights and performance metrics
            </p>
          </div>
          <Button
            onClick={exportData}
            icon={<Download className="w-5 h-5" />}
            variant="outline"
          >
            Export Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.newUsersThisMonth} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Offers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOffers}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.completedOffers} completed
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Food Rescued</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalKgRescued.toFixed(0)} kg</p>
                <p className="text-sm text-primary-600 mt-1">
                  {stats.mealsProvided} meals
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">CO₂ Saved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.co2Saved.toFixed(0)} kg</p>
                <p className="text-sm text-green-600 mt-1">
                  Environmental impact
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Success Rate */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Success Rate</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalOffers > 0 
                    ? ((stats.completedOffers / stats.totalOffers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${stats.totalOffers > 0 
                      ? (stats.completedOffers / stats.totalOffers) * 100 
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Donors */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Donors</h2>
            {stats.topDonors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No donors yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topDonors.map((donor, index) => (
                  <div key={donor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{donor.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600">{donor.count} offers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{donor.kg.toFixed(0)} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Partners */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Partners</h2>
            {stats.topPartners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No partners yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topPartners.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{partner.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600">{partner.count} pickups</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{partner.completed} completed</p>
                    </div>
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
