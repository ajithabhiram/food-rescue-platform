'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Leaf, Users, Package, Calendar, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { calculateCO2Saved, calculateMeals, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DonorImpactPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOffers: 0,
    completedOffers: 0,
    totalKg: 0,
    co2Saved: 0,
    mealsProvided: 0,
    partnersHelped: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadImpactData()
  }, [])

  const loadImpactData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get all offers
      const { data: offers } = await supabase
        .from('offers')
        .select('*, assignments(*)')
        .eq('donor_id', user.id)

      const totalKg = offers?.reduce((sum, offer) => sum + (offer.quantity_est || 0), 0) || 0
      const completedOffers = offers?.filter(o => o.status === 'delivered') || []
      const uniquePartners = new Set(
        offers?.flatMap(o => o.assignments?.map((a: any) => a.partner_id) || [])
      )

      setStats({
        totalOffers: offers?.length || 0,
        completedOffers: completedOffers.length,
        totalKg,
        co2Saved: calculateCO2Saved(totalKg),
        mealsProvided: calculateMeals(totalKg),
        partnersHelped: uniquePartners.size,
      })

      // Get recent completed offers
      const { data: recent } = await supabase
        .from('offers')
        .select('*')
        .eq('donor_id', user.id)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false })
        .limit(10)

      setRecentActivity(recent || [])
    } catch (error) {
      console.error('Error loading impact data:', error)
      toast.error('Failed to load impact data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="donor">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading impact data..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="donor">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Impact</h1>
          <p className="text-gray-600 mt-1">
            See the difference you're making in your community
          </p>
        </div>

        {/* Impact Hero */}
        <Card className="p-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="text-center">
            <Award className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-4xl font-bold mb-2">{stats.totalKg} kg</h2>
            <p className="text-xl opacity-90 mb-6">Total Food Rescued</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold">{stats.mealsProvided}</p>
                <p className="text-sm opacity-90">Meals Provided</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold">{stats.co2Saved.toFixed(1)}</p>
                <p className="text-sm opacity-90">kg CO₂ Saved</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Donations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOffers}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats.completedOffers} completed
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
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
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Partners Helped</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.partnersHelped}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Organizations reached
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
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Environmental Impact</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.co2Saved.toFixed(0)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    kg CO₂ emissions avoided
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Impact Breakdown */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Impact Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium text-gray-900">
                  {stats.totalOffers > 0 
                    ? Math.round((stats.completedOffers / stats.totalOffers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalOffers > 0 
                      ? (stats.completedOffers / stats.totalOffers) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.mealsProvided}</p>
                <p className="text-sm text-gray-600">Meals Provided</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Leaf className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.co2Saved.toFixed(1)} kg</p>
                <p className="text-sm text-gray-600">CO₂ Saved</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.partnersHelped}</p>
                <p className="text-sm text-gray-600">Partners</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Completed Donations</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No completed donations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{offer.title}</p>
                    <p className="text-sm text-gray-600">
                      {offer.quantity_est} {offer.quantity_unit} • {offer.food_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Completed</p>
                    <p className="text-xs text-gray-500">{formatDate(offer.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
