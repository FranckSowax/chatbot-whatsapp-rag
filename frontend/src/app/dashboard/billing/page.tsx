'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import useSWR from 'swr'
import { CreditCard, Download, Check } from 'lucide-react'

type Invoice = {
  id: string
  period_start: string
  period_end: string
  amount_cents: number
  overage_cents: number
}

const plans = [
  {
    name: 'Starter',
    price: 29,
    features: ['500 messages/month', '5 documents', 'Email support'],
    current: false,
  },
  {
    name: 'Professional',
    price: 79,
    features: ['2,000 messages/month', '20 documents', 'Priority support', 'Analytics'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited messages', 'Unlimited documents', '24/7 support', 'Custom integrations'],
    current: false,
  },
]

export default function BillingPage() {
  const { data: usage } = useSWR('billing/usage', () => api.billing.getUsage())
  const { data: invoices } = useSWR<Invoice[]>('billing/invoices', () => api.billing.getInvoices())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and view billing history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Messages Used</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-gray-900">
                  {usage?.current_usage?.messages || 0}
                </span>
                <span className="text-gray-500 mb-1">
                  / {usage?.limits?.monthly_request_limit || 1000}
                </span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
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
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-gray-900">
                  {usage?.current_usage?.documents || 0}
                </span>
                <span className="text-gray-500 mb-1">uploaded</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Storage: {usage?.limits?.storage_limit_mb || 100} MB available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-lg p-6 ${
                  plan.current ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
              >
                {plan.current && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded mb-3">
                    Current Plan
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? 'outline' : 'primary'}
                  className="w-full mt-6"
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing History</CardTitle>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">•••• 4242</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${(invoice.amount_cents / 100).toFixed(2)}
                      {invoice.overage_cents > 0 && (
                        <span className="text-orange-600">
                          {' '}+ ${(invoice.overage_cents / 100).toFixed(2)} overage
                        </span>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p>No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
