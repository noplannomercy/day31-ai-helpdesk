import { render } from '@react-email/components';
import { sendEmail } from '@/lib/email';
import { TicketCreatedEmail } from '@/lib/email/templates/ticket-created';
import { TicketReplyEmail } from '@/lib/email/templates/ticket-reply';
import { SLAWarningEmail } from '@/lib/email/templates/sla-warning';
import { SLAViolatedEmail } from '@/lib/email/templates/sla-violated';
import { getMinutesUntilDeadline, getMinutesOverdue } from './sla-service';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send notification when a new ticket is created and assigned to an agent
 */
export async function sendTicketCreatedNotification({
  ticketId,
  ticketTitle,
  customerName,
  priority,
  category,
  agentEmail,
}: {
  ticketId: string;
  ticketTitle: string;
  customerName: string;
  priority: string;
  category: string;
  agentEmail: string;
}): Promise<boolean> {
  try {
    const ticketUrl = `${APP_URL}/tickets/${ticketId}`;

    const emailHtml = await render(
      TicketCreatedEmail({
        ticketId,
        ticketTitle,
        customerName,
        priority,
        category,
        ticketUrl,
      })
    );

    const success = await sendEmail({
      to: agentEmail,
      subject: `[티켓 할당] ${ticketTitle}`,
      html: emailHtml,
    });

    return success;
  } catch (error) {
    console.error('Error sending ticket created notification:', error);
    return false;
  }
}

/**
 * Send notification when a reply is added to a ticket
 */
export async function sendTicketReplyNotification({
  ticketId,
  ticketTitle,
  replierName,
  replyContent,
  recipientEmail,
  recipientName,
}: {
  ticketId: string;
  ticketTitle: string;
  replierName: string;
  replyContent: string;
  recipientEmail: string;
  recipientName: string;
}): Promise<boolean> {
  try {
    const ticketUrl = `${APP_URL}/tickets/${ticketId}`;

    const emailHtml = await render(
      TicketReplyEmail({
        ticketId,
        ticketTitle,
        replierName,
        replyContent,
        ticketUrl,
        recipientName,
      })
    );

    const success = await sendEmail({
      to: recipientEmail,
      subject: `[티켓 답변] ${ticketTitle}`,
      html: emailHtml,
    });

    return success;
  } catch (error) {
    console.error('Error sending ticket reply notification:', error);
    return false;
  }
}

/**
 * Send SLA warning notification to agent
 */
export async function sendSLAWarningNotification({
  ticketId,
  ticketTitle,
  agentName,
  agentEmail,
  slaType,
  deadline,
}: {
  ticketId: string;
  ticketTitle: string;
  agentName: string;
  agentEmail: string;
  slaType: 'response' | 'resolve';
  deadline: Date;
}): Promise<boolean> {
  try {
    const ticketUrl = `${APP_URL}/tickets/${ticketId}`;
    const minutesRemaining = getMinutesUntilDeadline(deadline);

    // Only send if there's still time remaining
    if (minutesRemaining <= 0) {
      return false;
    }

    const emailHtml = await render(
      SLAWarningEmail({
        ticketId,
        ticketTitle,
        agentName,
        slaType,
        minutesRemaining,
        ticketUrl,
      })
    );

    const slaTypeText = slaType === 'response' ? '응답' : '해결';
    const success = await sendEmail({
      to: agentEmail,
      subject: `[SLA 경고] ${slaTypeText} SLA 마감 임박 - ${ticketTitle}`,
      html: emailHtml,
    });

    return success;
  } catch (error) {
    console.error('Error sending SLA warning notification:', error);
    return false;
  }
}

/**
 * Send SLA violation notification to managers
 */
export async function sendSLAViolationNotification({
  ticketId,
  ticketTitle,
  agentName,
  slaType,
  deadline,
}: {
  ticketId: string;
  ticketTitle: string;
  agentName: string;
  slaType: 'response' | 'resolve';
  deadline: Date;
}): Promise<boolean> {
  try {
    // Get all managers and admins
    const managers = await db.query.users.findMany({
      where: (users, { or, eq }) =>
        or(eq(users.role, 'manager'), eq(users.role, 'admin')),
    });

    if (managers.length === 0) {
      console.warn('No managers found to send SLA violation notification');
      return false;
    }

    const ticketUrl = `${APP_URL}/tickets/${ticketId}`;
    const violatedBy = getMinutesOverdue(deadline);

    const slaTypeText = slaType === 'response' ? '응답' : '해결';
    let successCount = 0;

    // Send to all managers
    for (const manager of managers) {
      try {
        const emailHtml = await render(
          SLAViolatedEmail({
            ticketId,
            ticketTitle,
            agentName,
            slaType,
            violatedBy,
            ticketUrl,
            managerName: manager.name,
          })
        );

        const success = await sendEmail({
          to: manager.email,
          subject: `[SLA 위반] ${slaTypeText} SLA 초과 - ${ticketTitle}`,
          html: emailHtml,
        });

        if (success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending SLA violation to ${manager.email}:`, error);
      }
    }

    return successCount > 0;
  } catch (error) {
    console.error('Error sending SLA violation notifications:', error);
    return false;
  }
}

/**
 * Send status change notification to customer
 */
export async function sendStatusChangeNotification({
  ticketId,
  ticketTitle,
  customerEmail,
  customerName,
  oldStatus,
  newStatus,
}: {
  ticketId: string;
  ticketTitle: string;
  customerEmail: string;
  customerName: string;
  oldStatus: string;
  newStatus: string;
}): Promise<boolean> {
  try {
    const ticketUrl = `${APP_URL}/tickets/${ticketId}`;

    const statusMap: Record<string, string> = {
      open: '접수됨',
      in_progress: '처리중',
      resolved: '해결됨',
      closed: '종료됨',
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">티켓 상태가 변경되었습니다</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>안녕하세요, ${customerName}님</p>
            <p>귀하의 티켓 상태가 업데이트되었습니다.</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>티켓 번호:</strong> ${ticketId.slice(0, 8)}</p>
              <p><strong>제목:</strong> ${ticketTitle}</p>
              <p><strong>이전 상태:</strong> ${statusMap[oldStatus] || oldStatus}</p>
              <p><strong>새 상태:</strong> ${statusMap[newStatus] || newStatus}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">티켓 확인하기</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">이 이메일은 AI Help Desk 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </body>
      </html>
    `;

    const success = await sendEmail({
      to: customerEmail,
      subject: `[티켓 상태 변경] ${ticketTitle}`,
      html: emailHtml,
    });

    return success;
  } catch (error) {
    console.error('Error sending status change notification:', error);
    return false;
  }
}
