/**
 * Neural Nine Trend Analysis API Route
 * 
 * Next.js API route that calls the Python AI Backend Core
 * POST /api/neural-nine/trend
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const NEURAL_NINE_API_URL = process.env.NEURAL_NINE_API_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { category = 'general', depth = 'deep' } = body

    // Python AI Backend Core 호출
    const response = await fetch(`${NEURAL_NINE_API_URL}/api/agent/trend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, depth }),
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
    console.error('[Neural Nine Trend API] 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * Get Agent Status
 * GET /api/neural-nine/trend/status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId가 필요합니다.' },
        { status: 400 }
      )
    }

    // Python AI Backend Core 호출
    const response = await fetch(`${NEURAL_NINE_API_URL}/api/agent/status/${taskId}`)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: '작업을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      throw new Error(`AI Backend 오류: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error) {
    console.error('[Neural Nine Status API] 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
