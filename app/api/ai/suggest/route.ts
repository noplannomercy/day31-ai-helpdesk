/**
 * POST /api/ai/suggest
 *
 * Generates AI answer suggestion for a ticket.
 * Only accessible to Agent, Manager, and Admin roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateResponse } from '@/lib/services/ai-service';
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
        { error: '권한이 없습니다. Agent 이상만 사용 가능합니다.' },
        { status: 403 }
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
    const { ticketId, useCustomPrompt = true } = body;

    // Validate input
    if (!ticketId || typeof ticketId !== 'string') {
      return NextResponse.json(
        { error: '티켓 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Generate AI response
    const result = await generateResponse(ticketId, {
      useCustomPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Answer generation API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'AI 답변 생성 중 오류가 발생했습니다.',
        success: false,
      },
      { status: 500 }
    );
  }
}
