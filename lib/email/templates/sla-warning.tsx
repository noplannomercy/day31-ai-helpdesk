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

interface SLAWarningEmailProps {
  ticketId: string;
  ticketTitle: string;
  agentName: string;
  slaType: 'response' | 'resolve';
  minutesRemaining: number;
  ticketUrl: string;
}

export function SLAWarningEmail({
  ticketId,
  ticketTitle,
  agentName,
  slaType,
  minutesRemaining,
  ticketUrl,
}: SLAWarningEmailProps) {
  const slaTypeText = slaType === 'response' ? '응답' : '해결';

  return (
    <Html lang="ko">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>⚠️ SLA 마감 임박 경고</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>안녕하세요, {agentName}님</Text>
            <Text style={warningText}>
              다음 티켓의 SLA {slaTypeText} 마감 시간이 <strong>{minutesRemaining}분</strong> 남았습니다.
            </Text>

            <Section style={ticketInfo}>
              <Text style={infoRow}>
                <strong>티켓 번호:</strong> {ticketId.slice(0, 8)}
              </Text>
              <Text style={infoRow}>
                <strong>제목:</strong> {ticketTitle}
              </Text>
              <Text style={infoRow}>
                <strong>SLA 유형:</strong> {slaTypeText} SLA
              </Text>
              <Text style={infoRow}>
                <strong>남은 시간:</strong> 약 {minutesRemaining}분
              </Text>
            </Section>

            <Section style={alertBox}>
              <Text style={alertText}>
                SLA 마감 시간 내에 {slaType === 'response' ? '첫 응답을 등록' : '티켓을 해결'}해 주시기 바랍니다.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                티켓 바로 처리하기
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

export default SLAWarningEmail;

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
  backgroundColor: '#f59e0b',
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

const warningText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#b45309',
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
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

const alertBox = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fb923c',
  borderRadius: '8px',
  padding: '15px',
  margin: '20px 0',
};

const alertText = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#c2410c',
  textAlign: 'center' as const,
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#f59e0b',
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
