'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Package, TrendingUp, Calendar, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OfferCard from '@/components/donor/OfferCard'
import CreateOfferModal from '@/components/donor/CreateOfferModal'
import OfferAcceptedNotification from '@/components/donor/OfferAcceptedNotification'
import { calculateCO2Saved, calculateMeals } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DonorDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    totalKg: 0,
    co2Saved: 0,
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (userError) {
        console.error('Error fetching user:', userError)
      }

      // Use user metadata name if available, otherwise use database name
      const displayName = authUser.user_metadata?.name || userData?.name || authUser.email?.split('@')[0] || 'User'
      setUser({ ...userData, name: displayName })

      // Get offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('*, assignments(*)')
        .eq('donor_id', authUser.id)
        .order('created_at', { ascending: false })

      setOffers(offersData || [])

      // Calculate stats
      const totalKg = offersData?.reduce((sum, offer) => sum + (offer.quantity_est || 0), 0) || 0
      setStats({
        totalOffers: offersData?.length || 0,
        activeOffers: offersData?.filter(o => o.status === 'available').length || 0,
        totalKg,
        co2Saved: calculateCO2Saved(totalKg),
      })
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="donor">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="donor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Welcome back, {user?.name || 'Donor'}! 👋
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage your food donations and track your impact
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
            size="lg"
            className="w-full sm:w-auto flex-shrink-0"
          >
            Post Offer
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
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOffers}</p>
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
                  <p className="text-sm font-medium text-gray-600 mb-2">Active Offers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeOffers}</p>
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
                  <p className="text-sm font-medium text-gray-600 mb-2">Food Rescued</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalKg} kg</p>
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

        {/* Offers List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Offers</h2>
          
          {offers.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers yet</h3>
              <p className="text-gray-600 mb-6">
                Start making a difference by posting your first food donation
              </p>
              <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-5 h-5" />}>
                Create Your First Offer
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <OfferCard offer={offer} onUpdate={loadData} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadData()
        }}
      />

      {/* Offer Accepted Notifications */}
      <OfferAcceptedNotification />
    </DashboardLayout>
  )
}
