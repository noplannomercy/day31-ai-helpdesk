/**
 * 최근 생성된 티켓 확인
 */

import { db } from '../lib/db';
import { tickets, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkTickets() {
  try {
    console.log('=== 최근 티켓 확인 ===\n');

    // 최근 티켓 조회 (agent 정보 join)
    const recentTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        customerId: tickets.customerId,
        agentId: tickets.agentId,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .limit(5);

    console.log(`총 ${recentTickets.length}개의 티켓\n`);

    for (const ticket of recentTickets) {
      console.log(`티켓 ID: ${ticket.id}`);
      console.log(`  제목: ${ticket.title}`);
      console.log(`  상태: ${ticket.status}`);
      console.log(`  우선순위: ${ticket.priority}`);
      console.log(`  Customer ID: ${ticket.customerId}`);
      console.log(`  Agent ID: ${ticket.agentId || '(할당 안 됨)'}`);
      console.log(`  생성일: ${ticket.createdAt}`);

      // Customer 정보
      if (ticket.customerId) {
        const [customer] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, ticket.customerId))
          .limit(1);
        if (customer) {
          console.log(`  고객: ${customer.name} (${customer.email})`);
        }
      }

      // Agent 정보
      if (ticket.agentId) {
        const [agent] = await db
          .select({ name: users.name, email: users.email, isOnline: users.isOnline })
          .from(users)
          .where(eq(users.id, ticket.agentId))
          .limit(1);
        if (agent) {
          console.log(`  담당자: ${agent.name} (${agent.email})`);
          console.log(`  담당자 온라인: ${agent.isOnline}`);
        }
      }

      console.log('');
    }

    // 온라인 Agent 확인
    console.log('=== 온라인 Agent 확인 ===\n');
    const onlineAgents = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isOnline: users.isOnline,
        isAway: users.isAway,
      })
      .from(users)
      .where(eq(users.role, 'agent'));

    console.log(`Agent 계정: ${onlineAgents.length}개\n`);
    for (const agent of onlineAgents) {
      console.log(`${agent.name} (${agent.email})`);
      console.log(`  온라인: ${agent.isOnline}`);
      console.log(`  자리비움: ${agent.isAway}`);
      console.log(`  할당 가능: ${agent.isOnline && !agent.isAway ? '✓' : '✗'}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

checkTickets();
