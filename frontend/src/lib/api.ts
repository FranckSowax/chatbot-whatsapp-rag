const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1)
  }
  
  // Remove /api/v1 if present (we add it later)
  if (url.endsWith('/api/v1')) {
    url = url.slice(0, -7)
  }
  
  return url
}

const API_URL = getBaseUrl()

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (options.headers) {
    Object.assign(headers, options.headers)
  }
  
  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || 'An error occurred')
  }
  
  return response.json()
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; company_name: string }) =>
      fetchWithAuth('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
  },
  
  customers: {
    getProfile: () => fetchWithAuth('/customers/me'),
    updateProfile: (data: { company_name?: string; manychat_api_key?: string; chatbot_prompt?: string }) =>
      fetchWithAuth('/customers/me', { method: 'PATCH', body: JSON.stringify(data) }),
    getWebhookUrl: () => fetchWithAuth('/customers/me/webhook-url'),
    getChatbotPrompt: () => fetchWithAuth('/customers/me/chatbot-prompt'),
    updateChatbotPrompt: (chatbot_prompt: string) =>
      fetchWithAuth('/customers/me/chatbot-prompt', { 
        method: 'PUT', 
        body: JSON.stringify({ chatbot_prompt }) 
      }),
  },
  
  documents: {
    list: () => fetchWithAuth('/documents'),
    get: (id: number) => fetchWithAuth(`/documents/${id}`),
    delete: (id: number) => fetchWithAuth(`/documents/${id}`, { method: 'DELETE' }),
    upload: async (file: File) => {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(error.detail)
      }
      
      return response.json()
    },
  },
  
  messages: {
    list: (params?: { limit?: number; offset?: number; user_phone?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.user_phone) searchParams.set('user_phone', params.user_phone)
      return fetchWithAuth(`/messages?${searchParams.toString()}`)
    },
    getConversations: () => fetchWithAuth('/messages/conversations'),
  },
  
  billing: {
    getUsage: () => fetchWithAuth('/billing/usage'),
    getInvoices: () => fetchWithAuth('/billing/invoices'),
  },
}
