// ConvertKit API integration for email nurture sequences

interface KitSubscriber {
  id: number
  first_name: string | null
  email_address: string
  state: 'active' | 'inactive' | 'cancelled'
  created_at: string
  fields: Record<string, any>
}

interface KitResponse {
  subscription?: {
    id: number
    state: string
    created_at: string
    source: string
    referrer: string | null
    subscribable_id: number
    subscribable_type: string
    subscriber: KitSubscriber
  }
  error?: string
  message?: string
}

export const kitService = {
  /**
   * Add a subscriber to a ConvertKit form
   * This automatically starts the email nurture sequence associated with the form
   */
  async addSubscriber(
    email: string,
    formId?: string,
    options?: {
      firstName?: string
      tags?: string[]
      fields?: Record<string, any>
      customFields?: Record<string, any>
    }
  ): Promise<{ success: boolean; subscriber?: KitSubscriber; error?: string }> {
    const apiKey = process.env.CONVERTKIT_API_KEY
    const defaultFormId = process.env.CONVERTKIT_FORM_ID

    // Use provided formId or fall back to default
    const targetFormId = formId || defaultFormId

    if (!apiKey) {
      console.warn('[KIT] ConvertKit API key not configured')
      return { success: false, error: 'ConvertKit not configured' }
    }

    if (!targetFormId) {
      console.warn('[KIT] ConvertKit form ID not configured')
      return { success: false, error: 'Form ID not configured' }
    }

    try {
      const requestBody: any = {
        api_key: apiKey,
        email: email.toLowerCase().trim(),
      }

      if (options?.firstName) {
        requestBody.first_name = options.firstName
      }

      // ConvertKit accepts tags as an array of tag IDs (numbers) or tag names (strings)
      // If tags are provided, add them to the request
      if (options?.tags && options.tags.length > 0) {
        requestBody.tags = options.tags
      }

      if (options?.fields) {
        requestBody.fields = options.fields
      }

      if (options?.customFields) {
        // ConvertKit uses 'fields' for custom fields
        requestBody.fields = { ...requestBody.fields, ...options.customFields }
      }

      const response = await fetch(
        `https://api.convertkit.com/v3/forms/${targetFormId}/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      const data: KitResponse = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to add subscriber'
        console.error('[KIT] API error:', errorMessage)
        return { success: false, error: errorMessage }
      }

      if (data.subscription?.subscriber) {
        console.log(`[KIT] Successfully added ${email} to form ${targetFormId}`)
        return {
          success: true,
          subscriber: data.subscription.subscriber,
        }
      }

      return { success: false, error: 'Unexpected response from ConvertKit' }
    } catch (error: any) {
      console.error('[KIT] Error adding subscriber:', error)
      return { success: false, error: error.message || 'Network error' }
    }
  },

  /**
   * Add tags to an existing subscriber
   */
  async tagSubscriber(
    email: string,
    tags: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.CONVERTKIT_API_KEY
    const apiSecret = process.env.CONVERTKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      console.warn('[KIT] ConvertKit credentials not configured')
      return { success: false, error: 'ConvertKit not configured' }
    }

    try {
      // First, find the subscriber by email
      const subscriberResponse = await fetch(
        `https://api.convertkit.com/v3/subscribers?api_secret=${apiSecret}&email_address=${encodeURIComponent(email)}`
      )

      const subscriberData = await subscriberResponse.json()

      if (!subscriberData.subscribers || subscriberData.subscribers.length === 0) {
        return { success: false, error: 'Subscriber not found' }
      }

      const subscriberId = subscriberData.subscribers[0].id

      // Add tags to subscriber
      const tagResponse = await fetch(
        `https://api.convertkit.com/v3/tags/${tags[0]}/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_secret: apiSecret,
            email,
          }),
        }
      )

      if (!tagResponse.ok) {
        const errorData = await tagResponse.json()
        return { success: false, error: errorData.error || 'Failed to tag subscriber' }
      }

      console.log(`[KIT] Tagged ${email} with ${tags.join(', ')}`)
      return { success: true }
    } catch (error: any) {
      console.error('[KIT] Error tagging subscriber:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update custom fields for a subscriber
   */
  async updateSubscriberFields(
    email: string,
    fields: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const apiSecret = process.env.CONVERTKIT_API_SECRET

    if (!apiSecret) {
      return { success: false, error: 'ConvertKit API secret not configured' }
    }

    try {
      // Find subscriber
      const subscriberResponse = await fetch(
        `https://api.convertkit.com/v3/subscribers?api_secret=${apiSecret}&email_address=${encodeURIComponent(email)}`
      )

      const subscriberData = await subscriberResponse.json()

      if (!subscriberData.subscribers || subscriberData.subscribers.length === 0) {
        return { success: false, error: 'Subscriber not found' }
      }

      const subscriberId = subscriberData.subscribers[0].id

      // Update fields
      const updateResponse = await fetch(
        `https://api.convertkit.com/v3/subscribers/${subscriberId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_secret: apiSecret,
            fields,
          }),
        }
      )

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        return { success: false, error: errorData.error || 'Failed to update fields' }
      }

      console.log(`[KIT] Updated fields for ${email}`)
      return { success: true }
    } catch (error: any) {
      console.error('[KIT] Error updating subscriber fields:', error)
      return { success: false, error: error.message }
    }
  },
}

export default kitService
