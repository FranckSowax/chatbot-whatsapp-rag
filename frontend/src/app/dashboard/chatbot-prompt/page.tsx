'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Bot, Save, RotateCcw } from 'lucide-react'

const DEFAULT_PROMPT = `Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas.`

export default function ChatbotPromptPage() {
  const { refreshProfile } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPrompt()
  }, [])

  const loadPrompt = async () => {
    setLoading(true)
    try {
      const data = await api.customers.getChatbotPrompt()
      const currentPrompt = data.chatbot_prompt || DEFAULT_PROMPT
      setPrompt(currentPrompt)
      setOriginalPrompt(currentPrompt)
    } catch (err) {
      setError('Failed to load chatbot prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await api.customers.updateChatbotPrompt(prompt)
      setOriginalPrompt(prompt)
      setSuccess(true)
      await refreshProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT)
  }

  const handleRevert = () => {
    setPrompt(originalPrompt)
  }

  const hasChanges = prompt !== originalPrompt

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chatbot Prompt</h1>
        <p className="text-gray-600 mt-1">
          Customize the system prompt that defines how your AI chatbot responds to questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>System Prompt</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Chatbot prompt saved successfully!
            </div>
          )}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Instructions
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm font-mono"
              placeholder="Enter your chatbot system prompt..."
            />
            <p className="mt-2 text-sm text-gray-500">
              This prompt will be used as the system instruction for your AI chatbot. 
              The context from your documents and the user&apos;s question will be automatically appended.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="text-sm text-gray-600 font-mono whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
              {prompt}
              {'\n\n'}
              <span className="text-blue-600">Contexte: [Documents pertinents seront insérés ici]</span>
              {'\n'}
              <span className="text-green-600">Question: [Question de l&apos;utilisateur sera insérée ici]</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {hasChanges && (
                <span className="text-orange-600">You have unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Button variant="ghost" onClick={handleRevert} disabled={saving}>
                  Discard Changes
                </Button>
              )}
              <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Be specific:</strong> Clearly define the role and behavior of your chatbot.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Set boundaries:</strong> Tell the AI what it should and shouldn&apos;t do.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Define tone:</strong> Specify if responses should be formal, friendly, concise, etc.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Handle unknowns:</strong> Instruct how to respond when information isn&apos;t available.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Language:</strong> Specify the language for responses if needed.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
