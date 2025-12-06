import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { detailerService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using Supabase Auth
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details
    const detailer = await detailerService.getByDetailerId(auth.detailerId)
    
    if (!detailer) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: detailer.id,
        detailer_id: detailer.detailer_id,
        business_name: detailer.business_name,
        contact_name: detailer.contact_name,
        email: detailer.email,
        phone: detailer.phone,
        is_active: detailer.is_active
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

