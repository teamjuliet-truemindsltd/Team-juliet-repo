import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Outbox, OutboxStatus } from './entities/outbox.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;
  private readonly MAX_RETRIES = 5;

  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxMessages() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const messages = await this.outboxRepository.find({
        where: [
          { status: OutboxStatus.PENDING },
          { status: OutboxStatus.FAILED, attempts: LessThan(this.MAX_RETRIES) },
        ],
        take: 10,
        order: { createdAt: 'ASC' },
      });

      if (messages.length === 0) {
        return;
      }

      for (const message of messages) {
        message.status = OutboxStatus.PROCESSING;
        // Increment attempts so that if it crashes it will be recorded
        message.attempts += 1;
        await this.outboxRepository.save(message);

        try {
          await this.processMessage(message);
          message.status = OutboxStatus.COMPLETED;
          message.processedAt = new Date();
          message.lastError = null;
          await this.outboxRepository.save(message);
          this.logger.debug(`Successfully processed outbox message ${message.id}`);
        } catch (error) {
          this.logger.error(`Failed to process outbox message ${message.id}`, error.stack);
          message.status = OutboxStatus.FAILED;
          message.lastError = error.message;
          await this.outboxRepository.save(message);
        }
      }
    } catch (error) {
      this.logger.error('Error in outbox processing loop', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: Outbox) {
    if (message.type === 'OTP_EMAIL') {
      const { email, code } = message.payload;
      await this.notificationsService.sendOtpEmail(email, code);
    } else if (message.type === 'PASSWORD_RESET_EMAIL') {
      const { email, code } = message.payload;
      await this.notificationsService.sendPasswordResetEmail(email, code);
    } else {
      this.logger.warn(`Unknown outbox message type: ${message.type}`);
    }
  }
}
