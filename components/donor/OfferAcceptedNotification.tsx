'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, User, Phone, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  offer_title: string
  partner_name: string
  partner_phone: string
  otp_code: string
  created_at: string
}

export default function OfferAcceptedNotification() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to new assignments
    const channel = supabase
      .channel('offer-accepted')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignments',
        },
        (payload) => {
          handleNewAssignment(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get recent assignments for user's offers
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          otp_code,
          created_at,
          offers!inner(id, title, donor_id),
          partner:users!partner_id(name, phone)
        `)
        .eq('offers.donor_id', user.id)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })

      if (assignments) {
        const notifs: Notification[] = assignments.map((a: any) => ({
          id: a.id,
          offer_title: a.offers?.title || 'Offer',
          partner_name: a.partner?.name || 'Partner',
          partner_phone: a.partner?.phone || 'Not provided',
          otp_code: a.otp_code,
          created_at: a.created_at,
        }))
        setNotifications(notifs)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleNewAssignment = async (assignment: any) => {
    try {
      // Fetch full details
      const { data } = await supabase
        .from('assignments')
        .select(`
          id,
          otp_code,
          created_at,
          offers!inner(id, title),
          partner:users!partner_id(name, phone)
        `)
        .eq('id', assignment.id)
        .single()

      if (data) {
        const notif: Notification = {
          id: data.id,
          offer_title: (data.offers as any)?.title || 'Offer',
          partner_name: (data.partner as any)?.name || 'Partner',
          partner_phone: (data.partner as any)?.phone || 'Not provided',
          otp_code: data.otp_code,
          created_at: data.created_at,
        }
        
        setNotifications(prev => [notif, ...prev])
        
        // Show toast notification
        toast.success(`Your offer "${(data.offers as any)?.title || 'Your offer'}" was accepted!`, {
          duration: 5000,
          icon: '🎉',
        })
      }
    } catch (error) {
      console.error('Error handling new assignment:', error)
    }
  }

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id))

  if (visibleNotifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {visibleNotifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Card className="p-4 shadow-2xl border-2 border-green-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Offer Accepted!</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{notif.offer_title}</span> was accepted by:
                </p>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{notif.partner_name}</span>
                </div>

                {notif.partner_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{notif.partner_phone}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  Pickup Verification Code (OTP):
                </p>
                <p className="text-2xl font-bold text-yellow-900 text-center tracking-wider">
                  {notif.otp_code}
                </p>
                <p className="text-xs text-yellow-700 mt-2 text-center">
                  Share this code with the partner during pickup
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dismissNotification(notif.id)}
                  className="flex-1"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(notif.otp_code)
                    toast.success('OTP copied to clipboard!')
                  }}
                  className="flex-1"
                >
                  Copy OTP
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
