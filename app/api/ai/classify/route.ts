/**
 * POST /api/ai/classify
 *
 * Classifies a ticket into a category using AI.
 * Used during ticket creation to suggest appropriate category.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { classifyCategory } from '@/lib/services/ai-service';
import { isOpenRouterAvailable } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check if AI is available
    if (!isOpenRouterAvailable()) {
      return NextResponse.json(
        {
          error: 'AI 서비스가 설정되지 않았습니다.',
          available: false,
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    // Validate input
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Classify category
    const result = await classifyCategory(title.trim(), content.trim());

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Category classification API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '카테고리 분류 중 오류가 발생했습니다.',
        success: false,
      },
      { status: 500 }
    );
  }
}
