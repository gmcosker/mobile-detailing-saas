import { NextRequest, NextResponse } from 'next/server'
import { kitService } from '@/lib/kit'

// GET /api/leads/test-kit - Test ConvertKit integration
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CONVERTKIT_API_KEY
    const formId = process.env.CONVERTKIT_FORM_ID
    const apiSecret = process.env.CONVERTKIT_API_SECRET

    const diagnostics = {
      hasApiKey: !!apiKey,
      hasFormId: !!formId,
      hasApiSecret: !!apiSecret,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
      formId: formId || 'NOT SET',
      apiSecretPrefix: apiSecret ? `${apiSecret.substring(0, 8)}...` : 'NOT SET',
    }

    // Test with a dummy email (won't actually subscribe, just test API connection)
    if (apiKey && formId) {
      try {
        // Try to get form details to verify API key works
        const testResponse = await fetch(
          `https://api.convertkit.com/v3/forms/${formId}?api_key=${apiKey}`
        )
        
        const testData = await testResponse.json()
        
        return NextResponse.json({
          success: testResponse.ok && !!testData.form,
          diagnostics,
          formTest: {
            status: testResponse.status,
            ok: testResponse.ok,
            formName: testData.form?.name || 'Unknown',
            formExists: !!testData.form,
            error: testData.error || testData.message || null,
            rawResponse: testData, // Include full response for debugging
          },
          message: testResponse.ok && testData.form
            ? 'ConvertKit API is working correctly' 
            : testData.error || testData.message || `Form ID ${formId} not found. Check your CONVERTKIT_FORM_ID.`,
        })
      } catch (testError: any) {
        return NextResponse.json({
          success: false,
          diagnostics,
          error: testError.message,
          message: 'Failed to connect to ConvertKit API',
        })
      }
    }

    return NextResponse.json({
      success: false,
      diagnostics,
      message: 'ConvertKit environment variables are missing',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error testing ConvertKit integration',
    }, { status: 500 })
  }
}

