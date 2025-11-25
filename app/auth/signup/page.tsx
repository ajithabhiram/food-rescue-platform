'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building, Leaf, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'donor' | 'partner'>(
    (searchParams.get('role') as 'donor' | 'partner') || 'donor'
  )
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign up user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/${role}`,
          data: {
            name: formData.name,
            role: role,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Account created successfully in Supabase Auth
        console.log('Auth account created:', authData.user.id)

        // Try to create profiles, but don't fail if there are issues
        // The trigger should handle user profile creation
        try {
          // Wait for trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1500))

          // Wait for trigger to create user - DO NOT create manually
          // The trigger will set approved = NULL for partners automatically
          console.log('Waiting for trigger to create user profile...')

          // Create role-specific profile
          if (role === 'donor') {
            const { error: profileError } = await supabase.from('donor_profiles').insert({
              user_id: authData.user.id,
              business_name: formData.businessName || null,
            })
            if (profileError) {
              console.error('Donor profile error:', profileError)
              // Don't throw - can be created later
            }
          } else {
            const { error: profileError } = await supabase.from('partner_profiles').insert({
              user_id: authData.user.id,
              org_name: formData.businessName || formData.name,
            })
            if (profileError) {
              console.error('Partner profile error:', profileError)
              // Don't throw - can be created later
            }
          }
        } catch (profileError) {
          // Log but don't fail - user account is created
          console.error('Profile creation error:', profileError)
        }

        // Always show success if auth account was created
        toast.success('Account created! Check your email to verify, then sign in.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 text-primary-600 hover:text-primary-700">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to home</span>
            </Link>
            
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Leaf className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Join the food rescue movement
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('donor')}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === 'donor'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building className={`w-6 h-6 mx-auto mb-2 ${role === 'donor' ? 'text-primary-600' : 'text-gray-400'}`} />
              <div className={`font-medium ${role === 'donor' ? 'text-primary-600' : 'text-gray-600'}`}>
                Donor
              </div>
              <div className="text-xs text-gray-500 mt-1">Post surplus food</div>
            </button>

            <button
              type="button"
              onClick={() => setRole('partner')}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === 'partner'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className={`w-6 h-6 mx-auto mb-2 ${role === 'partner' ? 'text-primary-600' : 'text-gray-400'}`} />
              <div className={`font-medium ${role === 'partner' ? 'text-primary-600' : 'text-gray-600'}`}>
                Partner
              </div>
              <div className="text-xs text-gray-500 mt-1">Receive donations</div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              icon={<User className="w-5 h-5" />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              type="text"
              label={role === 'donor' ? 'Business Name (Optional)' : 'Organization Name'}
              placeholder={role === 'donor' ? 'Your Restaurant' : 'Your Organization'}
              icon={<Building className="w-5 h-5" />}
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required={role === 'partner'}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-primary-100 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
