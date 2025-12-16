import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// GET /api/guide - Serve the free guide PDF
export async function GET(request: NextRequest) {
  try {
    // Path to the PDF file in the public folder
    const filePath = join(process.cwd(), 'public', 'guide.pdf')
    
    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Return the PDF with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Growing-Your-Mobile-Detailing-Business.pdf"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving guide PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load guide' },
      { status: 500 }
    )
  }
}
