'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OfferCard from '@/components/donor/OfferCard'
import CreateOfferModal from '@/components/donor/CreateOfferModal'
import toast from 'react-hot-toast'

export default function DonorOffersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<any[]>([])
  const [filteredOffers, setFilteredOffers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadOffers()
  }, [])

  useEffect(() => {
    filterOffers()
  }, [searchQuery, statusFilter, offers])

  const loadOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('offers')
        .select('*, assignments(*, partner:users!partner_id(name, phone))')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOffers(data || [])
      setFilteredOffers(data || [])
    } catch (error) {
      console.error('Error loading offers:', error)
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const filterOffers = () => {
    let filtered = offers

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.food_type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOffers(filtered)
  }

  if (loading) {
    return (
      <DashboardLayout role="donor">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading offers..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="donor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
            <p className="text-gray-600 mt-1">
              Manage all your food donation offers
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
            size="lg"
          >
            Create Offer
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search offers..."
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'available').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-2xl font-bold text-blue-600">
              {offers.filter(o => o.status === 'accepted').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-purple-600">
              {offers.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No offers found' : 'No offers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first offer to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-5 h-5" />}>
                Create Offer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OfferCard offer={offer} onUpdate={loadOffers} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadOffers()
        }}
      />
    </DashboardLayout>
  )
}
