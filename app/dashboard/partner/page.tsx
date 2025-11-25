'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, MapPin, Calendar, TrendingUp, ArrowRight, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime, calculateCO2Saved, calculateMeals } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PartnerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    availableOffers: 0,
    myPickups: 0,
    completedPickups: 0,
    totalKgReceived: 0,
    co2Saved: 0,
    mealsProvided: 0,
  })
  const [recentOffers, setRecentOffers] = useState<any[]>([])
  const [upcomingPickups, setUpcomingPickups] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      // Check partner approval status
      if (userData?.role === 'partner') {
        if (userData.approved === null) {
          // Pending approval
          router.push('/dashboard/partner/pending')
          return
        } else if (userData.approved === false) {
          // Rejected
          router.push('/dashboard/partner/rejected')
          return
        }
        // approved === true, continue to dashboard
      }

      const displayName = authUser.user_metadata?.name || userData?.name || authUser.email?.split('@')[0] || 'User'
      setUser({ ...userData, name: displayName })

      // Get available offers count
      const { data: availableOffers } = await supabase
        .from('offers')
        .select('id, quantity_est')
        .eq('status', 'available')
        .gte('pickup_window_end', new Date().toISOString())

      // Get my assignments
      const { data: myAssignments } = await supabase
        .from('assignments')
        .select('*, offers(quantity_est)')
        .eq('partner_id', authUser.id)

      const completedAssignments = myAssignments?.filter(a => a.status === 'completed') || []
      const totalKgReceived = completedAssignments.reduce((sum, a) => sum + (a.offers?.quantity_est || 0), 0)

      setStats({
        availableOffers: availableOffers?.length || 0,
        myPickups: myAssignments?.filter(a => a.status === 'pending').length || 0,
        completedPickups: completedAssignments.length,
        totalKgReceived,
        co2Saved: calculateCO2Saved(totalKgReceived),
        mealsProvided: calculateMeals(totalKgReceived),
      })

      // Get recent available offers (top 3) - simplified query
      const { data: recentOffersData } = await supabase
        .from('offers')
        .select('*, donor:users!donor_id(name)')
        .eq('status', 'available')
        .gte('pickup_window_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      // Get donor profiles for recent offers
      if (recentOffersData && recentOffersData.length > 0) {
        const donorIds = recentOffersData.map(o => o.donor_id).filter(Boolean)
        const { data: profiles } = await supabase
          .from('donor_profiles')
          .select('user_id, business_name')
          .in('user_id', donorIds)
        
        // Attach profiles to offers
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
        recentOffersData.forEach(offer => {
          offer.donor_profile = profileMap.get(offer.donor_id)
        })
      }

      setRecentOffers(recentOffersData || [])

      // Get upcoming pickups - simplified query
      const { data: upcomingData } = await supabase
        .from('assignments')
        .select('*, offers(*, donor:users!donor_id(name))')
        .eq('partner_id', authUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3)

      // Get donor profiles for upcoming pickups
      if (upcomingData && upcomingData.length > 0) {
        const donorIds = upcomingData.map(p => p.offers?.donor_id).filter(Boolean)
        if (donorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('donor_profiles')
            .select('user_id, business_name')
            .in('user_id', donorIds)
          
          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
          upcomingData.forEach(pickup => {
            if (pickup.offers) {
              pickup.offers.donor_profile = profileMap.get(pickup.offers.donor_id)
            }
          })
        }
      }

      setUpcomingPickups(upcomingData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="partner">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="partner">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Welcome back, {user?.name || 'Partner'}! 🤝
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Browse and accept food donations in your area
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/partner/browse')}
            icon={<Package className="w-5 h-5" />}
            size="lg"
            className="w-full sm:w-auto flex-shrink-0"
          >
            Browse Offers
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">Available Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.availableOffers}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">My Pickups</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.myPickups}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">Food Received</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalKgReceived.toFixed(0)} kg</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.mealsProvided} meals</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">CO₂ Saved</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.co2Saved.toFixed(1)} kg</p>
                </div>
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <Leaf className="w-6 h-6 text-secondary-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Available Offers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Offers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/partner/browse')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                View All
              </Button>
            </div>

            {recentOffers.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No offers available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push('/dashboard/partner/browse')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                      <Badge variant="success">Available</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {offer.quantity_est} {offer.quantity_unit} • {offer.food_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      From: {offer.donor_profile?.business_name || offer.donor?.name || 'Anonymous'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Pickups */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Pickups</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/partner/pickups')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                View All
              </Button>
            </div>

            {upcomingPickups.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming pickups</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/partner/browse')}
                  className="mt-3"
                >
                  Browse Offers
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPickups.map((pickup) => (
                  <div
                    key={pickup.id}
                    className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => router.push('/dashboard/partner/pickups')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{pickup.offers?.title}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {pickup.offers?.quantity_est} {pickup.offers?.quantity_unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pickup: {formatDateTime(pickup.offers?.pickup_window_start)}
                    </p>
                    <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">OTP:</span>{' '}
                        <span className="font-bold text-gray-900">{pickup.otp_code}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Impact Summary */}
        {stats.completedPickups > 0 && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Impact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.completedPickups}</p>
                <p className="text-sm text-gray-600 mt-1">Completed Pickups</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.mealsProvided}</p>
                <p className="text-sm text-gray-600 mt-1">Meals Provided</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{stats.co2Saved.toFixed(1)} kg</p>
                <p className="text-sm text-gray-600 mt-1">CO₂ Saved</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
