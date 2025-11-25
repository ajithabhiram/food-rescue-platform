'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Package, Calendar, MapPin, User, Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminOffersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<any[]>([])
  const [filteredOffers, setFilteredOffers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    checkAdminAccess()
    loadOffers()
  }, [])

  useEffect(() => {
    filterOffers()
  }, [searchQuery, statusFilter, offers])

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

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          donor:users!donor_id(name, email),
          assignments(
            id,
            status,
            partner:users!partner_id(name)
          )
        `)
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.donor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOffers(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      available: 'success',
      accepted: 'info',
      picked_up: 'warning',
      delivered: 'default',
      cancelled: 'error',
    }
    return colors[status] || 'default'
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading offers..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all food donation offers
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search offers..."
                icon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full lg:w-48">
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
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'available').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-2xl font-bold text-blue-600">
              {offers.filter(o => o.status === 'accepted').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-primary-600">
              {offers.filter(o => o.status === 'delivered').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total kg</p>
            <p className="text-2xl font-bold text-gray-900">
              {offers.reduce((sum, o) => sum + (o.quantity_est || 0), 0).toFixed(0)}
            </p>
          </Card>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {offer.title}
                  </h3>
                  <Badge variant={getStatusColor(offer.status)}>
                    {offer.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                  {offer.description || 'No description'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {offer.quantity_est} {offer.quantity_unit} • {offer.food_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {offer.donor?.name || 'Anonymous'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {formatDateTime(offer.pickup_window_start)}
                    </span>
                  </div>

                  {offer.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{offer.address}</span>
                    </div>
                  )}
                </div>

                {offer.assignments && offer.assignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Assigned to:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {offer.assignments[0].partner?.name || 'Partner'}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No offers found
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No offers have been created yet'}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
