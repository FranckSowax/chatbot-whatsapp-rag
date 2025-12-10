'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Plug, Copy, Check, ExternalLink } from 'lucide-react'

export default function IntegrationsPage() {
  const { profile, refreshProfile } = useAuth()
  const [manychatKey, setManychatKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.manychat_api_key) {
      setManychatKey(profile.manychat_api_key)
    }
    loadWebhookUrl()
  }, [profile])

  const loadWebhookUrl = async () => {
    try {
      const data = await api.customers.getWebhookUrl()
      setWebhookUrl(data.webhook_url)
    } catch (err) {
      console.error('Failed to load webhook URL')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await api.customers.updateProfile({ manychat_api_key: manychatKey })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Connect your ManyChat account to enable WhatsApp messaging
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plug className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle>ManyChat Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ManyChat API key saved successfully!
            </div>
          )}

          <div>
            <Input
              id="manychat-key"
              type="password"
              label="ManyChat API Key"
              value={manychatKey}
              onChange={(e) => setManychatKey(e.target.value)}
              placeholder="Enter your ManyChat API key"
            />
            <p className="mt-2 text-sm text-gray-500">
              Find your API key in ManyChat Settings → API → API Key
            </p>
          </div>

          <Button onClick={handleSave} loading={saving}>
            Save API Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Copy this webhook URL and paste it into your ManyChat flow&apos;s External Request action.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 overflow-x-auto">
              {webhookUrl || 'Loading...'}
            </div>
            <Button variant="outline" onClick={copyToClipboard} disabled={!webhookUrl}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Go to your ManyChat flow editor</li>
              <li>Add an &quot;External Request&quot; action</li>
              <li>Set the method to POST</li>
              <li>Paste the webhook URL above</li>
              <li>Configure the request body with user_id, first_name, last_text_input, and client_api_key</li>
            </ol>
          </div>

          <a
            href="https://manychat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Open ManyChat Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Body Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Configure your ManyChat External Request with this JSON body format:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "user_id": "{{user_id}}",
  "first_name": "{{first_name}}",
  "last_text_input": "{{last_text_input}}",
  "client_api_key": "${profile?.id || 'YOUR_CLIENT_ID'}"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
