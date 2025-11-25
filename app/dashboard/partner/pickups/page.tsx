'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, MapPin, CheckCircle, XCircle, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PartnerPickupsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [pickups, setPickups] = useState<any[]>([])
  const [selectedPickup, setSelectedPickup] = useState<any>(null)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    loadPickups()
  }, [])

  const loadPickups = async () => {
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
        .from('assignments')
        .select('*, offers(*, donor:users!donor_id(name))')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get donor profiles separately
      if (data && data.length > 0) {
        const donorIds = data.map(p => p.offers?.donor_id).filter(Boolean)
        if (donorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('donor_profiles')
            .select('user_id, business_name, address')
            .in('user_id', donorIds)
          
          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
          data.forEach(pickup => {
            if (pickup.offers) {
              pickup.offers.donor_profile = profileMap.get(pickup.offers.donor_id)
            }
          })
        }
      }

      setPickups(data || [])
    } catch (error) {
      console.error('Error loading pickups:', error)
      toast.error('Failed to load pickups')
    } finally {
      setLoading(false)
    }
  }

  const handleCompletePickup = async () => {
    if (!selectedPickup) return
    
    setCompleting(true)
    
    try {
      // Verify OTP
      if (otpCode !== selectedPickup.otp_code) {
        toast.error('Invalid OTP code')
        return
      }

      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', selectedPickup.id)

      if (assignmentError) throw assignmentError

      // Update offer status
      const { error: offerError } = await supabase
        .from('offers')
        .update({ status: 'delivered' })
        .eq('id', selectedPickup.offer_id)

      if (offerError) throw offerError

      toast.success('Pickup completed successfully!')
      setShowOTPModal(false)
      setSelectedPickup(null)
      setOtpCode('')
      loadPickups()
    } catch (error: any) {
      console.error('Error completing pickup:', error)
      toast.error(error.message || 'Failed to complete pickup')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancelPickup = async (pickupId: string, offerId: string) => {
    if (!confirm('Are you sure you want to cancel this pickup?')) return

    try {
      // Update assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ status: 'cancelled' })
        .eq('id', pickupId)

      if (assignmentError) throw assignmentError

      // Update offer back to available
      const { error: offerError } = await supabase
        .from('offers')
        .update({ status: 'available' })
        .eq('id', offerId)

      if (offerError) throw offerError

      toast.success('Pickup cancelled')
      loadPickups()
    } catch (error) {
      console.error('Error cancelling pickup:', error)
      toast.error('Failed to cancel pickup')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'error',
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout role="partner">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading pickups..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="partner">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Pickups</h1>
          <p className="text-gray-600 mt-1">
            Manage your accepted offers and scheduled pickups
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{pickups.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pickups.filter(p => p.status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {pickups.filter(p => p.status === 'completed').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">
              {pickups.filter(p => p.status === 'cancelled').length}
            </p>
          </Card>
        </div>

        {/* Pickups List */}
        {pickups.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pickups yet</h3>
            <p className="text-gray-600 mb-6">
              Browse available offers to accept your first pickup
            </p>
            <Button onClick={() => router.push('/dashboard/partner/browse')}>
              Browse Offers
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {pickups.map((pickup, index) => (
              <motion.div
                key={pickup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Offer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {pickup.offers?.title}
                          </h3>
                          {getStatusBadge(pickup.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {pickup.offers?.quantity_est} {pickup.offers?.quantity_unit} • {pickup.offers?.food_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDateTime(pickup.offers?.pickup_window_start)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {pickup.offers?.donor_profile?.address || 'Location not specified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">From:</span>
                          <span className="truncate">
                            {pickup.offers?.donor_profile?.business_name || 
                             pickup.offers?.donor?.name || 'Anonymous'}
                          </span>
                        </div>
                      </div>

                      {pickup.otp_code && pickup.status === 'pending' && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">OTP Code:</span>{' '}
                            <span className="text-lg font-bold">{pickup.otp_code}</span>
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Share this code with the donor during pickup
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {pickup.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedPickup(pickup)
                              setShowOTPModal(true)
                            }}
                            icon={<CheckCircle className="w-4 h-4" />}
                            size="sm"
                          >
                            Complete Pickup
                          </Button>
                          <Button
                            onClick={() => handleCancelPickup(pickup.id, pickup.offer_id)}
                            variant="outline"
                            icon={<XCircle className="w-4 h-4" />}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {pickup.status === 'completed' && (
                        <div className="text-center py-2">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                          <p className="text-sm text-green-600 font-medium">Completed</p>
                          {pickup.completed_at && (
                            <p className="text-xs text-gray-500">
                              {formatDateTime(pickup.completed_at)}
                            </p>
                          )}
                        </div>
                      )}
                      {pickup.status === 'cancelled' && (
                        <div className="text-center py-2">
                          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                          <p className="text-sm text-red-600 font-medium">Cancelled</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false)
          setSelectedPickup(null)
          setOtpCode('')
        }}
        title="Complete Pickup"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter the OTP code to confirm pickup completion. The donor should provide this code.
          </p>

          <Input
            type="text"
            label="OTP Code"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            maxLength={6}
          />

          {selectedPickup && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Pickup Details:</p>
              <p className="font-medium text-gray-900">{selectedPickup.offers?.title}</p>
              <p className="text-sm text-gray-600">
                {selectedPickup.offers?.quantity_est} {selectedPickup.offers?.quantity_unit}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowOTPModal(false)
                setSelectedPickup(null)
                setOtpCode('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompletePickup}
              loading={completing}
              disabled={otpCode.length !== 6}
              className="flex-1"
            >
              Confirm Pickup
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
