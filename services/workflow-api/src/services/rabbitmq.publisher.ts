import amqp, { Channel } from 'amqplib';
import { randomUUID } from 'crypto';
import { IReport } from '@ecotrack/shared';

const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'ecotrack.events';
const ROUTING_KEY = 'report.resolved';

let channel: Channel | null = null;
let connecting: Promise<Channel | null> | null = null;

async function getChannel(): Promise<Channel | null> {
  if (channel) {
    return channel;
  }

  if (connecting) {
    return connecting;
  }

  const uri = process.env.RABBITMQ_URI;
  if (!uri) {
    return null;
  }

  connecting = (async () => {
    try {
      const connection = await amqp.connect(uri);
      const activeChannel = await connection.createChannel();

      await activeChannel.assertExchange(EXCHANGE, 'topic', { durable: true });

      connection.on('close', () => {
        channel = null;
      });
      connection.on('error', (err) => {
        console.error('[WORKFLOW-API] RabbitMQ connection error:', err.message);
        channel = null;
      });

      channel = activeChannel;
      return activeChannel;
    } catch (err: any) {
      console.error('[WORKFLOW-API] RabbitMQ unavailable, event skipped:', err.message);
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function publishReportResolved(report: IReport): Promise<void> {
  const activeChannel = await getChannel();
  if (!activeChannel) {
    return;
  }

  const payload = {
    eventId: randomUUID(),
    eventType: ROUTING_KEY,
    occurredAt: new Date().toISOString(),
    data: {
      reportId: report.id,
      reporterId: report.reporterId,
      status: report.status,
      resolvedAt: report.resolvedAt,
      completionPhotoUrl: report.completionPhotoUrl,
      assignedTeamId: report.assignedTeamId
    }
  };

  activeChannel.publish(
    EXCHANGE,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: 'application/json',
      messageId: payload.eventId,
      timestamp: Date.now()
    }
  );
}
