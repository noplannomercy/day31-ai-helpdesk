import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface TicketReplyEmailProps {
  ticketId: string;
  ticketTitle: string;
  replierName: string;
  replyContent: string;
  ticketUrl: string;
  recipientName: string;
}

export function TicketReplyEmail({
  ticketId,
  ticketTitle,
  replierName,
  replyContent,
  ticketUrl,
  recipientName,
}: TicketReplyEmailProps) {
  // Truncate content if too long
  const truncatedContent =
    replyContent.length > 500
      ? replyContent.substring(0, 500) + '...'
      : replyContent;

  return (
    <Html lang="ko">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>티켓에 새 답변이 등록되었습니다</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>안녕하세요, {recipientName}님</Text>
            <Text style={paragraph}>
              귀하의 티켓에 새로운 답변이 등록되었습니다.
            </Text>

            <Section style={ticketInfo}>
              <Text style={infoRow}>
                <strong>티켓 번호:</strong> {ticketId.slice(0, 8)}
              </Text>
              <Text style={infoRow}>
                <strong>제목:</strong> {ticketTitle}
              </Text>
              <Text style={infoRow}>
                <strong>답변자:</strong> {replierName}
              </Text>
            </Section>

            <Section style={replyBox}>
              <Text style={replyLabel}>답변 내용:</Text>
              <Text style={replyText}>{truncatedContent}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                전체 답변 확인하기
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              이 이메일은 AI Help Desk 시스템에서 자동으로 발송되었습니다.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default TicketReplyEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#10b981',
  padding: '20px',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '30px',
};

const greeting = {
  fontSize: '16px',
  marginBottom: '10px',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
};

const ticketInfo = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const infoRow = {
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '5px 0',
  color: '#1f2937',
};

const replyBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const replyLabel = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#065f46',
  marginBottom: '10px',
};

const replyText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#1f2937',
  whiteSpace: 'pre-wrap' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
};

const footer = {
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center' as const,
};
