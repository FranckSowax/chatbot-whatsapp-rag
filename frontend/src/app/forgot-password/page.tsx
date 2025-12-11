'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Check your email for the password reset link.
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <Input
                id="email"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
              
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
