import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Outbox, OutboxStatus } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
  ) {}

  async add(
    type: string,
    payload: any,
    entityManager?: EntityManager,
  ): Promise<Outbox> {
    const outboxRepo = entityManager
      ? entityManager.getRepository(Outbox)
      : this.outboxRepository;

    const outboxMessage = outboxRepo.create({
      type,
      payload,
      status: OutboxStatus.PENDING,
    });

    return await outboxRepo.save(outboxMessage);
  }
}
