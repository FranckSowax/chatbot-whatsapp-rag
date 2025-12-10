'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { api } from '@/lib/api'
import useSWR from 'swr'
import { BarChart3, MessageSquare, Clock, TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: usage } = useSWR('billing/usage', () => api.billing.getUsage())
  const { data: documents } = useSWR('documents', () => api.documents.list())

  const stats = [
    {
      name: 'Total Messages',
      value: usage?.current_usage?.messages || 0,
      change: '+12%',
      icon: MessageSquare,
    },
    {
      name: 'Documents Processed',
      value: documents?.filter((d: { status: string }) => d.status === 'processed').length || 0,
      change: '+3',
      icon: BarChart3,
    },
    {
      name: 'Avg Response Time',
      value: '4.2s',
      change: '-0.5s',
      icon: Clock,
    },
    {
      name: 'Satisfaction Rate',
      value: '94%',
      change: '+2%',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Monitor your chatbot performance and usage metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Chart visualization coming soon</p>
                <p className="text-sm">Connect more data to see trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Chart visualization coming soon</p>
                <p className="text-sm">Track response time improvements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Messages This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usage?.current_usage?.messages || 0}
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Limit</span>
                  <span className="text-gray-900">{usage?.limits?.monthly_request_limit || 1000}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((usage?.current_usage?.messages || 0) / (usage?.limits?.monthly_request_limit || 1000)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Documents Uploaded</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usage?.current_usage?.documents || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Storage limit: {usage?.limits?.storage_limit_mb || 100} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Calls Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              <p className="text-sm text-gray-500 mt-2">
                Real-time tracking available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
