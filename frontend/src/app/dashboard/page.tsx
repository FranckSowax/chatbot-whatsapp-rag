'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MessageSquare, FileText, Clock, TrendingUp } from 'lucide-react'
import useSWR from 'swr'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { data: usage } = useSWR('billing/usage', () => api.billing.getUsage())
  const { data: documents } = useSWR('documents', () => api.documents.list())

  const stats = [
    {
      name: 'Total Messages',
      value: usage?.current_usage?.messages || 0,
      icon: MessageSquare,
      color: 'blue',
    },
    {
      name: 'Documents',
      value: documents?.length || 0,
      icon: FileText,
      color: 'green',
    },
    {
      name: 'Avg Response Time',
      value: '4.2s',
      icon: Clock,
      color: 'purple',
    },
    {
      name: 'Satisfaction',
      value: '94%',
      icon: TrendingUp,
      color: 'orange',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.company_name || 'User'}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of your chatbot performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600 text-sm">
              {documents && documents.length > 0 ? (
                <ul className="space-y-3">
                  {documents.slice(0, 5).map((doc: { id: number; filename: string; status: string; created_at: string }) => (
                    <li key={doc.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {doc.filename}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.status === 'processed' ? 'bg-green-100 text-green-700' :
                        doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        doc.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {doc.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents uploaded yet. Upload your first PDF to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  profile?.manychat_api_key ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {profile?.manychat_api_key ? '✓' : '1'}
                </div>
                <span className={profile?.manychat_api_key ? 'text-gray-600' : 'text-gray-900 font-medium'}>
                  Configure ManyChat API Key
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  documents && documents.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {documents && documents.length > 0 ? '✓' : '2'}
                </div>
                <span className={documents && documents.length > 0 ? 'text-gray-600' : 'text-gray-900 font-medium'}>
                  Upload your first document
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                  3
                </div>
                <span className="text-gray-900 font-medium">
                  Customize your chatbot prompt
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
