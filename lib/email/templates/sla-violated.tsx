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

interface SLAViolatedEmailProps {
  ticketId: string;
  ticketTitle: string;
  agentName: string;
  slaType: 'response' | 'resolve';
  violatedBy: number; // minutes overdue
  ticketUrl: string;
  managerName: string;
}

export function SLAViolatedEmail({
  ticketId,
  ticketTitle,
  agentName,
  slaType,
  violatedBy,
  ticketUrl,
  managerName,
}: SLAViolatedEmailProps) {
  const slaTypeText = slaType === 'response' ? '응답' : '해결';
  const hours = Math.floor(violatedBy / 60);
  const minutes = violatedBy % 60;
  const overdueText = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

  return (
    <Html lang="ko">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>🚨 SLA 위반 발생</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>안녕하세요, {managerName}님</Text>
            <Text style={violationText}>
              SLA {slaTypeText} 마감 시간이 <strong>{overdueText}</strong> 초과되었습니다.
            </Text>

            <Section style={ticketInfo}>
              <Text style={infoRow}>
                <strong>티켓 번호:</strong> {ticketId.slice(0, 8)}
              </Text>
              <Text style={infoRow}>
                <strong>제목:</strong> {ticketTitle}
              </Text>
              <Text style={infoRow}>
                <strong>담당자:</strong> {agentName}
              </Text>
              <Text style={infoRow}>
                <strong>SLA 유형:</strong> {slaTypeText} SLA
              </Text>
              <Text style={infoRow}>
                <strong>초과 시간:</strong> {overdueText}
              </Text>
            </Section>

            <Section style={alertBox}>
              <Text style={alertTitle}>필요한 조치</Text>
              <Text style={alertText}>
                • 담당자와 즉시 연락하여 상황을 파악하세요
              </Text>
              <Text style={alertText}>
                • 필요 시 티켓을 재할당하거나 지원을 제공하세요
              </Text>
              <Text style={alertText}>
                • 고객에게 상황을 설명하고 사과하세요
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                티켓 확인 및 조치하기
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

export default SLAViolatedEmail;

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
  backgroundColor: '#dc2626',
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

const violationText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#991b1b',
  backgroundColor: '#fee2e2',
  padding: '15px',
  borderRadius: '6px',
  margin: '20px 0',
  textAlign: 'center' as const,
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
  backgroundColor: '#fef2f2',
  border: '2px solid #f87171',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const alertTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#991b1b',
  marginBottom: '10px',
};

const alertText = {
  fontSize: '14px',
  color: '#7f1d1d',
  margin: '8px 0',
  lineHeight: '1.6',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#dc2626',
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
