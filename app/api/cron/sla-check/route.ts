import { NextRequest, NextResponse } from 'next/server';
import {
  getTicketsApproachingResponseSLA,
  getTicketsApproachingResolveSLA,
  getTicketsViolatedResponseSLA,
  getTicketsViolatedResolveSLA,
} from '@/lib/services/sla-service';
import {
  sendSLAWarningNotification,
  sendSLAViolationNotification,
} from '@/lib/services/notification-service';

/**
 * Cron job endpoint to check SLA status and send notifications
 * Should be called every 15 minutes via Vercel Cron or external service
 *
 * Example Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sla-check",
 *     "schedule": "* /15 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      timestamp: new Date().toISOString(),
      warnings: {
        response: 0,
        resolve: 0,
      },
      violations: {
        response: 0,
        resolve: 0,
      },
      errors: [] as string[],
    };

    // 1. Check for tickets approaching response SLA deadline
    try {
      const approachingResponseTickets = await getTicketsApproachingResponseSLA();

      for (const ticket of approachingResponseTickets) {
        if (!ticket.agentEmail || !ticket.agentName || !ticket.slaResponseDeadline) {
          console.warn(`Ticket ${ticket.id} missing required data for notification`);
          continue;
        }

        const success = await sendSLAWarningNotification({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          agentName: ticket.agentName,
          agentEmail: ticket.agentEmail,
          slaType: 'response',
          deadline: ticket.slaResponseDeadline,
        });

        if (success) {
          results.warnings.response++;
        } else {
          results.errors.push(`Failed to send response warning for ticket ${ticket.id}`);
        }
      }
    } catch (error) {
      const errorMsg = `Error checking approaching response SLA: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 2. Check for tickets approaching resolve SLA deadline
    try {
      const approachingResolveTickets = await getTicketsApproachingResolveSLA();

      for (const ticket of approachingResolveTickets) {
        if (!ticket.agentEmail || !ticket.agentName || !ticket.slaResolveDeadline) {
          console.warn(`Ticket ${ticket.id} missing required data for notification`);
          continue;
        }

        const success = await sendSLAWarningNotification({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          agentName: ticket.agentName,
          agentEmail: ticket.agentEmail,
          slaType: 'resolve',
          deadline: ticket.slaResolveDeadline,
        });

        if (success) {
          results.warnings.resolve++;
        } else {
          results.errors.push(`Failed to send resolve warning for ticket ${ticket.id}`);
        }
      }
    } catch (error) {
      const errorMsg = `Error checking approaching resolve SLA: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 3. Check for tickets that violated response SLA
    try {
      const violatedResponseTickets = await getTicketsViolatedResponseSLA();

      for (const ticket of violatedResponseTickets) {
        if (!ticket.agentName || !ticket.slaResponseDeadline) {
          console.warn(`Ticket ${ticket.id} missing required data for violation notification`);
          continue;
        }

        const success = await sendSLAViolationNotification({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          agentName: ticket.agentName,
          slaType: 'response',
          deadline: ticket.slaResponseDeadline,
        });

        if (success) {
          results.violations.response++;
        } else {
          results.errors.push(`Failed to send response violation for ticket ${ticket.id}`);
        }
      }
    } catch (error) {
      const errorMsg = `Error checking violated response SLA: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 4. Check for tickets that violated resolve SLA
    try {
      const violatedResolveTickets = await getTicketsViolatedResolveSLA();

      for (const ticket of violatedResolveTickets) {
        if (!ticket.agentName || !ticket.slaResolveDeadline) {
          console.warn(`Ticket ${ticket.id} missing required data for violation notification`);
          continue;
        }

        const success = await sendSLAViolationNotification({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          agentName: ticket.agentName,
          slaType: 'resolve',
          deadline: ticket.slaResolveDeadline,
        });

        if (success) {
          results.violations.resolve++;
        } else {
          results.errors.push(`Failed to send resolve violation for ticket ${ticket.id}`);
        }
      }
    } catch (error) {
      const errorMsg = `Error checking violated resolve SLA: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Fatal error in SLA check cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
