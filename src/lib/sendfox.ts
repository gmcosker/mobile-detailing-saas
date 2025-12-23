// SendFox API integration for email marketing

interface SendFoxContact {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
}

interface SendFoxResponse {
  data?: SendFoxContact
  error?: string
  message?: string
}

export const sendfoxService = {
  /**
   * Add a subscriber to a SendFox list
   * This automatically adds them to your email list and any associated automations
   */
  async addSubscriber(
    email: string,
    listId?: string,
    options?: {
      firstName?: string
      lastName?: string
      tags?: string[]
      fields?: Record<string, any>
    }
  ): Promise<{ success: boolean; subscriber?: SendFoxContact; error?: string }> {
    const apiToken = process.env.SENDFOX_API_TOKEN
    const defaultListId = process.env.SENDFOX_LIST_ID

    // Use provided listId or fall back to default
    const targetListId = listId || defaultListId

    if (!apiToken) {
      console.warn('[SENDFOX] API token not configured')
      return { success: false, error: 'SendFox not configured' }
    }

    if (!targetListId) {
      console.warn('[SENDFOX] List ID not configured')
      return { success: false, error: 'List ID not configured' }
    }

    try {
      const requestBody: any = {
        email: email.toLowerCase().trim(),
        lists: [targetListId],
      }

      if (options?.firstName) {
        requestBody.first_name = options.firstName
      }

      if (options?.lastName) {
        requestBody.last_name = options.lastName
      }

      // SendFox supports custom fields
      if (options?.fields) {
        Object.assign(requestBody, options.fields)
      }

      const response = await fetch('https://api.sendfox.com/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data: SendFoxResponse = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to add subscriber'
        console.error('[SENDFOX] API error:', errorMessage)
        return { success: false, error: errorMessage }
      }

      if (data.data) {
        console.log(`[SENDFOX] Successfully added ${email} to list ${targetListId}`)
        return {
          success: true,
          subscriber: data.data,
        }
      }

      return { success: false, error: 'Unexpected response from SendFox' }
    } catch (error: any) {
      console.error('[SENDFOX] Error adding subscriber:', error)
      return { success: false, error: error.message || 'Network error' }
    }
  },
}

export default sendfoxService

