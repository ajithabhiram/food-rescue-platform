'use client'

import { useEffect, useState } from 'react'
import { XCircle, Mail, AlertCircle, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

export default function PartnerRejectedPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*, partner_profiles(org_name)')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      // If approved, redirect to dashboard
      if (userData.approved === true) {
        router.push('/dashboard/partner')
        return
      }

      // If still pending, redirect to pending page
      if (userData.approved === null) {
        router.push('/dashboard/partner/pending')
        return
      }

      // If not a partner, redirect
      if (userData.role !== 'partner') {
        router.push('/dashboard/donor')
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Error checking status:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking status..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Application Not Approved
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Unfortunately, your partner application was not approved at this time.
          </p>

          {/* Rejection Details */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  Reason for Rejection
                </h3>
                <p className="text-sm text-red-800">
                  {user?.rejection_reason || 'No specific reason provided. Please contact support for more information.'}
                </p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Application Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              {user?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
              )}
              {user?.partner_profiles?.[0]?.org_name && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium text-gray-900">
                    {user.partner_profiles[0].org_name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">Applied:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(user?.created_at)}
                </span>
              </div>
              {user?.approved_at && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Reviewed:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(user.approved_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* What You Can Do */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">What you can do:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span>•</span>
                <span>Review the rejection reason and address any concerns</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Contact our support team for clarification</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Update your profile information if needed</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Reapply after addressing the issues mentioned</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              icon={<Home className="w-4 h-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex-1"
            >
              Sign Out
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Have questions about your rejection?
            </p>
            <p className="text-sm text-primary-600 font-medium mt-1">
              Contact us at support@foodrescue.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
