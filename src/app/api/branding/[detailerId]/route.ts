import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isValidHexColor } from '@/lib/auth'
import { brandingService } from '@/lib/database'

// GET /api/branding/[detailerId] - Get branding settings for detailer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ detailerId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { detailerId } = await params
    
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get branding
    const branding = await brandingService.getByDetailerId(detailerId)

    return NextResponse.json({
      success: true,
      branding: branding || null
    })

  } catch (error) {
    console.error('Get branding error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/branding/[detailerId] - Update branding settings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ detailerId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { detailerId } = await params
    
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns detailerId
    if (detailerId !== auth.detailerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      primary_color,
      secondary_color,
      text_color,
      font_family,
      logo_url
    } = body

    // Build update object
    const updates: any = {}
    if (primary_color !== undefined) {
      if (primary_color && !isValidHexColor(primary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid primary_color format. Use hex color (e.g., #FF5733)' },
          { status: 400 }
        )
      }
      updates.primary_color = primary_color
    }
    if (secondary_color !== undefined) {
      if (secondary_color && !isValidHexColor(secondary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid secondary_color format. Use hex color (e.g., #FF5733)' },
          { status: 400 }
        )
      }
      updates.secondary_color = secondary_color
    }
    if (text_color !== undefined) {
      if (text_color && !isValidHexColor(text_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid text_color format. Use hex color (e.g., #FF5733)' },
          { status: 400 }
        )
      }
      updates.text_color = text_color
    }
    if (font_family !== undefined) updates.font_family = font_family
    if (logo_url !== undefined) {
      // Basic URL validation
      if (logo_url && !logo_url.startsWith('http://') && !logo_url.startsWith('https://')) {
        return NextResponse.json(
          { success: false, error: 'Invalid logo_url format. Must be a valid URL' },
          { status: 400 }
        )
      }
      updates.logo_url = logo_url
    }

    // Check if branding exists
    const existingBranding = await brandingService.getByDetailerId(detailerId)

    let branding
    if (existingBranding) {
      // Update existing branding
      const updated = await brandingService.update(detailerId, updates)
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to update branding' },
          { status: 500 }
        )
      }
      branding = await brandingService.getByDetailerId(detailerId)
    } else {
      // Create new branding
      const created = await brandingService.create(detailerId, updates)
      if (!created) {
        return NextResponse.json(
          { success: false, error: 'Failed to create branding' },
          { status: 500 }
        )
      }
      branding = await brandingService.getByDetailerId(detailerId)
    }

    return NextResponse.json({
      success: true,
      branding
    })

  } catch (error) {
    console.error('Update branding error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

