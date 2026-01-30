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

interface TicketCreatedEmailProps {
  ticketId: string;
  ticketTitle: string;
  customerName: string;
  priority: string;
  category: string;
  ticketUrl: string;
}

export function TicketCreatedEmail({
  ticketId,
  ticketTitle,
  customerName,
  priority,
  category,
  ticketUrl,
}: TicketCreatedEmailProps) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>새로운 티켓이 할당되었습니다</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>안녕하세요,</Text>
            <Text style={paragraph}>
              새로운 고객 문의 티켓이 귀하에게 할당되었습니다.
            </Text>

            <Section style={ticketInfo}>
              <Text style={infoRow}>
                <strong>티켓 번호:</strong> {ticketId.slice(0, 8)}
              </Text>
              <Text style={infoRow}>
                <strong>제목:</strong> {ticketTitle}
              </Text>
              <Text style={infoRow}>
                <strong>고객:</strong> {customerName}
              </Text>
              <Text style={infoRow}>
                <strong>우선순위:</strong> {priority}
              </Text>
              <Text style={infoRow}>
                <strong>카테고리:</strong> {category}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                티켓 확인하기
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

export default TicketCreatedEmail;

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
  backgroundColor: '#0066cc',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#0066cc',
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
