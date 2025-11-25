'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Package, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface OfferCardProps {
  offer: any
  onUpdate: () => void
}

export default function OfferCard({ offer, onUpdate }: OfferCardProps) {
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    available: 'success',
    accepted: 'info',
    picked_up: 'warning',
    delivered: 'default',
    cancelled: 'error',
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id)

      if (error) throw error

      toast.success('Offer deleted successfully')
      onUpdate()
    } catch (error) {
      toast.error('Failed to delete offer')
    }
  }

  return (
    <Card hover className="overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {offer.image_path ? (
          <Image
            src={offer.image_path}
            alt={offer.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={statusColors[offer.status]}>
            {offer.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
            >
              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {offer.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {offer.description || 'No description provided'}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>{offer.quantity_est} {offer.quantity_unit || 'kg'}</span>
            <span className="text-gray-400">•</span>
            <span className="text-primary-600 font-medium">{offer.food_type}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDateTime(offer.pickup_window_start)}</span>
          </div>

          {offer.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{offer.address}</span>
            </div>
          )}
        </div>

        {/* Assignment Info with OTP */}
        {offer.assignments && offer.assignments.length > 0 && offer.status === 'accepted' && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Accepted by:</span> {offer.assignments[0].partner?.name || 'Partner'}
              </p>
              {offer.assignments[0].partner?.phone && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {offer.assignments[0].partner.phone}
                </p>
              )}
            </div>
            
            {offer.assignments[0].otp_code && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  Pickup Verification Code (OTP):
                </p>
                <p className="text-xl font-bold text-yellow-900 text-center tracking-wider">
                  {offer.assignments[0].otp_code}
                </p>
                <p className="text-xs text-yellow-700 mt-1 text-center">
                  Share this code with partner during pickup
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
