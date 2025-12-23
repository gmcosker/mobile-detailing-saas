import { NextRequest, NextResponse } from 'next/server'
import { kitService } from '@/lib/kit'

// POST /api/leads/test-submit - Test submitting an email to ConvertKit
// This helps diagnose if the integration is working
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.CONVERTKIT_API_KEY
    const formId = process.env.CONVERTKIT_FORM_ID

    if (!apiKey || !formId) {
      return NextResponse.json({
        success: false,
        error: 'ConvertKit not configured',
        details: {
          hasApiKey: !!apiKey,
          hasFormId: !!formId,
        },
      })
    }

    // Test adding subscriber
    const result = await kitService.addSubscriber(email, formId, {
      tags: ['free_guide', 'test'],
      fields: {
        source: 'test',
      },
    })

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully added ${email} to ConvertKit. Check your ConvertKit dashboard to verify.`
        : `Failed to add ${email}: ${result.error}`,
      error: result.error,
      subscriber: result.subscriber,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error testing ConvertKit submission',
    }, { status: 500 })
  }
}

