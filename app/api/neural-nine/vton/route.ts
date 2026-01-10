/**
 * Neural Nine VTON API Route
 * 
 * Next.js API route that calls the Python AI Backend Core for Virtual Try-On
 * POST /api/neural-nine/vton
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const NEURAL_NINE_API_URL = process.env.NEURAL_NINE_API_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { user_image_url, garment_image_url, body_shape = 'standard' } = body

    if (!user_image_url || !garment_image_url) {
      return NextResponse.json(
        { success: false, error: 'user_image_url과 garment_image_url이 필요합니다.' },
        { status: 400 }
      )
    }

    // Python AI Backend Core 호출
    const response = await fetch(`${NEURAL_NINE_API_URL}/api/agent/vton`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_image_url, garment_image_url, body_shape }),
    })

    if (!response.ok) {
      throw new Error(`AI Backend 오류: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error) {
    console.error('[Neural Nine VTON API] 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
