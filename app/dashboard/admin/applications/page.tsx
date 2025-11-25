'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, XCircle, User, Mail, Phone, MapPin, 
  Building, Calendar, AlertCircle 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminApplicationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadApplications()
  }, [])

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

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, partner_profiles(org_name, address, city, capacity_info)')
        .eq('role', 'partner')
        .is('approved', null) // Only show pending (not yet reviewed)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    setProcessing(true)
    
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser()
      if (!adminUser) throw new Error('Not authenticated')

      console.log('Approving user:', userId)

      // Get partner details before updating
      const { data: partnerData } = await supabase
        .from('users')
        .select('*, partner_profiles(org_name)')
        .eq('id', userId)
        .single()

      // Update approval status
      const { data, error } = await supabase
        .from('users')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: adminUser.id,
        })
        .eq('id', userId)
        .select()

      console.log('Approve result:', { data, error })

      if (error) {
        console.error('Approve error details:', error)
        throw error
      }

      // Send approval email via Resend
      if (partnerData) {
        try {
          const dashboardLink = `${window.location.origin}/dashboard/partner`
          const approvedDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          
          const emailResult = await supabase.functions.invoke('send-email', {
            body: {
              to: partnerData.email,
              templateKey: 'partner_approved',
              variables: {
                partner_name: partnerData.name || 'Partner',
                org_name: partnerData.partner_profiles?.[0]?.org_name || 'Your Organization',
                email: partnerData.email,
                approved_date: approvedDate,
                dashboard_link: dashboardLink,
                support_email: 'support@foodrescue.com'
              }
            }
          })
          
          if (emailResult.error) {
            console.error('❌ Email error:', emailResult.error)
          } else {
            console.log('✅ Approval email sent via Resend to:', partnerData.email)
          }
        } catch (emailError: any) {
          console.error('❌ Failed to send approval email:', emailError)
          // Don't fail approval if email fails
        }
      }

      toast.success('Partner application approved! Email sent.')
      loadApplications()
    } catch (error: any) {
      console.error('Error approving application:', error)
      toast.error(error.message || 'Failed to approve application')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser()
      if (!adminUser) throw new Error('Not authenticated')

      console.log('Rejecting user:', selectedApp.id)

      // Update rejection status
      const { data, error } = await supabase
        .from('users')
        .update({
          approved: false,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          approved_by: adminUser.id,
        })
        .eq('id', selectedApp.id)
        .select()

      console.log('Reject result:', { data, error })

      if (error) {
        console.error('Reject error details:', error)
        throw error
      }

      // Send rejection email via Resend
      try {
        const supportLink = `${window.location.origin}/contact`
        const reviewedDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        
        const emailResult = await supabase.functions.invoke('send-email', {
          body: {
            to: selectedApp.email,
            templateKey: 'partner_rejected',
            variables: {
              partner_name: selectedApp.name || 'Partner',
              org_name: selectedApp.partner_profiles?.[0]?.org_name || 'Your Organization',
              email: selectedApp.email,
              rejection_reason: rejectionReason,
              reviewed_date: reviewedDate,
              support_link: supportLink,
              support_email: 'support@foodrescue.com'
            }
          }
        })
        
        if (emailResult.error) {
          console.error('❌ Email error:', emailResult.error)
        } else {
          console.log('✅ Rejection email sent via Resend to:', selectedApp.email)
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send rejection email:', emailError)
        // Don't fail rejection if email fails
      }

      toast.success('Application rejected. Email sent.')
      setShowRejectModal(false)
      setSelectedApp(null)
      setRejectionReason('')
      loadApplications()
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      toast.error(error.message || 'Failed to reject application')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading applications..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and approve partner applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{applications.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Approved Today</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Rejected Today</p>
            <p className="text-2xl font-bold text-red-600">0</p>
          </Card>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Pending Applications
            </h3>
            <p className="text-gray-600">
              All partner applications have been reviewed
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Application Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {app.name || 'No name provided'}
                          </h3>
                          <Badge variant="warning">Pending Review</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{app.email}</span>
                        </div>

                        {app.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{app.phone}</span>
                          </div>
                        )}

                        {app.partner_profiles?.[0]?.org_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4 flex-shrink-0" />
                            <span>{app.partner_profiles[0].org_name}</span>
                          </div>
                        )}

                        {app.partner_profiles?.[0]?.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{app.partner_profiles[0].city}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Applied: {formatDate(app.created_at)}</span>
                        </div>
                      </div>

                      {app.partner_profiles?.[0]?.address && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Address:</p>
                          <p className="text-sm text-gray-600">
                            {app.partner_profiles[0].address}
                          </p>
                        </div>
                      )}

                      {app.application_notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Notes:</p>
                          <p className="text-sm text-blue-800">
                            {app.application_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Button
                        onClick={() => handleApprove(app.id)}
                        loading={processing}
                        icon={<CheckCircle className="w-4 h-4" />}
                        className="w-full"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedApp(app)
                          setShowRejectModal(true)
                        }}
                        variant="outline"
                        icon={<XCircle className="w-4 h-4" />}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedApp(null)
          setRejectionReason('')
        }}
        title="Reject Application"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  You are about to reject this application
                </p>
                <p className="text-sm text-red-700 mt-1">
                  The applicant will be notified with the reason you provide.
                </p>
              </div>
            </div>
          </div>

          {selectedApp && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Applicant:</p>
              <p className="font-medium text-gray-900">{selectedApp.name}</p>
              <p className="text-sm text-gray-600">{selectedApp.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Please provide a clear reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be sent to the applicant
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false)
                setSelectedApp(null)
                setRejectionReason('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              loading={processing}
              disabled={!rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
