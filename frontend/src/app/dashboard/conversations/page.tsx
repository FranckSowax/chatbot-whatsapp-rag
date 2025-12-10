'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import useSWR from 'swr'
import { MessageSquare, User, ArrowRight } from 'lucide-react'

type Message = {
  id: number
  user_phone: string
  direction: 'inbound' | 'outbound'
  content: string
  created_at: string
}

type Conversation = {
  user_phone: string
  last_message_at: string
  message_count: number
}

export default function ConversationsPage() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const { data: conversations, isLoading: loadingConversations } = useSWR<Conversation[]>(
    'conversations',
    () => api.messages.getConversations()
  )
  const { data: messages, isLoading: loadingMessages } = useSWR<Message[]>(
    selectedPhone ? `messages/${selectedPhone}` : null,
    () => api.messages.list({ user_phone: selectedPhone!, limit: 50 })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-1">
          View and manage WhatsApp conversations with your customers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <button
                    key={conv.user_phone}
                    onClick={() => setSelectedPhone(conv.user_phone)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedPhone === conv.user_phone ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{conv.user_phone}</p>
                      <p className="text-sm text-gray-500">
                        {conv.message_count} messages
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>No conversations yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPhone ? `Chat with ${selectedPhone}` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPhone ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Select a contact to view the conversation</p>
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No messages in this conversation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
