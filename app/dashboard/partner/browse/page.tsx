'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Package, Clock, Filter as FilterIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PartnerBrowsePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<any[]>([])
  const [filteredOffers, setFilteredOffers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [foodTypeFilter, setFoodTypeFilter] = useState<string>('all')
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    loadOffers()
  }, [])

  useEffect(() => {
    filterOffers()
  }, [searchQuery, foodTypeFilter, offers])

  const loadOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check partner approval status
      const { data: userData } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', user.id)
        .maybeSingle()

      if (userData?.role === 'partner') {
        if (userData.approved === null) {
          router.push('/dashboard/partner/pending')
          return
        } else if (userData.approved === false) {
          router.push('/dashboard/partner/rejected')
          return
        }
      }

      const { data, error } = await supabase
        .from('offers')
        .select('*, donor:users!donor_id(name)')
        .eq('status', 'available')
        .gte('pickup_window_end', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get donor profiles separately
      if (data && data.length > 0) {
        const donorIds = data.map(o => o.donor_id).filter(Boolean)
        const { data: profiles } = await supabase
          .from('donor_profiles')
          .select('user_id, business_name, address')
          .in('user_id', donorIds)
        
        // Attach profiles to offers
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
        data.forEach(offer => {
          offer.donor_profile = profileMap.get(offer.donor_id)
        })
      }

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

    if (foodTypeFilter !== 'all') {
      filtered = filtered.filter(offer => offer.food_type === foodTypeFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOffers(filtered)
  }

  const handleAcceptOffer = async (offerId: string) => {
    setAccepting(offerId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First, create assignment
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          offer_id: offerId,
          partner_id: user.id,
          status: 'pending',
          otp_code: otpCode,
        })

      if (assignmentError) {
        console.error('Assignment error:', assignmentError)
        throw new Error('Failed to create assignment: ' + assignmentError.message)
      }

      // Then update offer status
      const { error: offerError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)

      if (offerError) {
        console.error('Offer update error:', offerError)
        throw new Error('Failed to update offer status: ' + offerError.message)
      }

      // Remove the accepted offer from the list immediately
      setOffers(prev => prev.filter(o => o.id !== offerId))
      setFilteredOffers(prev => prev.filter(o => o.id !== offerId))

      toast.success('Offer accepted! Check My Pickups for details.')
      
      // Reload to ensure consistency
      setTimeout(() => loadOffers(), 500)
    } catch (error: any) {
      console.error('Error accepting offer:', error)
      toast.error(error.message || 'Failed to accept offer')
    } finally {
      setAccepting(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="partner">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading offers..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="partner">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Offers</h1>
          <p className="text-gray-600 mt-1">
            Find and accept food donations in your area
          </p>
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
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="produce">Produce</option>
              <option value="prepared">Prepared Food</option>
              <option value="packaged">Packaged Goods</option>
              <option value="bakery">Bakery</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat/Protein</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">{offers.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Filtered</p>
            <p className="text-2xl font-bold text-gray-900">{filteredOffers.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total kg</p>
            <p className="text-2xl font-bold text-primary-600">
              {filteredOffers.reduce((sum, o) => sum + (o.quantity_est || 0), 0).toFixed(0)}
            </p>
          </Card>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <FilterIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || foodTypeFilter !== 'all' ? 'No offers found' : 'No available offers'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || foodTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back later for new donations'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {offer.image_path ? (
                      <img
                        src={offer.image_path}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="success">Available</Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {offer.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                      {offer.description || 'No description provided'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span>{offer.quantity_est} {offer.quantity_unit || 'kg'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-primary-600 font-medium capitalize">{offer.food_type}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatDateTime(offer.pickup_window_start)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {offer.donor_profile?.address || offer.address || 'Location not specified'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">From:</span>{' '}
                          {offer.donor_profile?.business_name || offer.donor?.name || 'Anonymous'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAcceptOffer(offer.id)}
                      loading={accepting === offer.id}
                      className="w-full"
                    >
                      Accept Offer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
