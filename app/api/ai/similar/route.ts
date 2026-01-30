/**
 * GET /api/ai/similar?ticketId=xxx
 *
 * Finds similar tickets based on keyword matching.
 * Uses database search, not AI API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findSimilarTickets } from '@/lib/services/ai-service';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get('ticketId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    // Validate input
    if (!ticketId) {
      return NextResponse.json(
        { error: '티켓 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'limit은 1-20 사이의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // Find similar tickets
    const similarTickets = await findSimilarTickets(ticketId, limit);

    return NextResponse.json({
      success: true,
      data: similarTickets,
      count: similarTickets.length,
    });

  } catch (error) {
    console.error('Similar tickets API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '유사 티켓 검색 중 오류가 발생했습니다.',
        success: false,
      },
      { status: 500 }
    );
  }
}
