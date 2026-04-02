import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { ForumThread } from './entities/forum-thread.entity';
import { ForumReply } from './entities/forum-reply.entity';
import { DirectMessage } from './entities/direct-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumThread, ForumReply, DirectMessage])],
  controllers: [CollaborationController],
  providers: [CollaborationService],
})
export class CollaborationModule {}