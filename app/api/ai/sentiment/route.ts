/**
 * POST /api/ai/sentiment
 *
 * Analyzes the sentiment of ticket content.
 * Returns positive, neutral, or negative sentiment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeSentiment } from '@/lib/services/ai-service';
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

    // Check role (Agent, Manager, Admin only)
    const allowedRoles = ['agent', 'manager', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Check if AI is available
    if (!isOpenRouterAvailable()) {
      return NextResponse.json(
        {
          sentiment: 'neutral',
          confidence: 0,
          reason: 'AI 서비스가 설정되지 않았습니다.',
          available: false,
        },
        { status: 200 } // Return 200 with neutral sentiment for graceful degradation
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '분석할 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Analyze sentiment
    const result = await analyzeSentiment(content.trim());

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Sentiment analysis API error:', error);

    // Return neutral sentiment on error (graceful degradation)
    return NextResponse.json(
      {
        success: false,
        data: {
          sentiment: 'neutral',
          confidence: 0,
          reason: '감정 분석 중 오류가 발생했습니다.',
        },
      },
      { status: 200 } // Return 200 for graceful degradation
    );
  }
}
