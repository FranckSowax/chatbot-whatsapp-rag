'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a session (handled by supabase auth flow)
    const checkSession = async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      if (!session) {
        // If no session, user might not have clicked the link or link expired
        // But in recovery flow, supabase automatically signs in the user
        // setError('Invalid or expired reset link.')
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase!.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
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
          <CardTitle className="text-2xl">Set new password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Password updated successfully! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <Input
                id="password"
                type="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              
              <Button type="submit" className="w-full" loading={loading}>
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
