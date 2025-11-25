'use client'

import { motion } from 'framer-motion'
import { Package, Clock, MapPin, Navigation } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDateTime, formatDistance } from '@/lib/utils'

interface OfferCardWithDistanceProps {
  offer: any
  distance?: number
  onAccept: (offerId: string) => void
  accepting: boolean
}

export default function OfferCardWithDistance({
  offer,
  distance,
  onAccept,
  accepting,
}: OfferCardWithDistanceProps) {
  return (
    <Card hover className="overflow-hidden h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
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
        
        {/* Distance Badge - Top Right */}
        {distance !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3"
          >
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-bold text-gray-900">
                {formatDistance(distance)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <Badge variant="success" className="shadow-lg">
            Available
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {offer.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {offer.description || 'No description provided'}
        </p>

        {/* Details Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-semibold">{offer.quantity_est}</span> {offer.quantity_unit || 'kg'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-primary-600 font-medium capitalize">
              {offer.food_type}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{formatDateTime(offer.pickup_window_start)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {offer.donor_profile?.business_name || offer.donor?.name || 'Anonymous Donor'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3 mb-3">
          <p className="text-xs text-gray-500">
            {offer.donor_profile?.address || offer.address || 'Location not specified'}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onAccept(offer.id)}
          loading={accepting}
          className="w-full"
          size="lg"
        >
          Accept Offer
        </Button>
      </div>
    </Card>
  )
}
