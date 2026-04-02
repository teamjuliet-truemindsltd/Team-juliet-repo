import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumThread } from './entities/forum-thread.entity';
import { ForumReply } from './entities/forum-reply.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(ForumThread)
    private readonly threadRepository: Repository<ForumThread>,
    @InjectRepository(ForumReply)
    private readonly replyRepository: Repository<ForumReply>,
    @InjectRepository(DirectMessage)
    private readonly messageRepository: Repository<DirectMessage>,
  ) {}

  async createThread(userId: number, dto: CreateThreadDto) {
    const thread = this.threadRepository.create({
      authorId: userId,
      courseId: dto.courseId,
      title: dto.title,
      content: dto.content,
    });

    return this.threadRepository.save(thread);
  }

  async getThreadsByCourse(courseId: string) {
    return this.threadRepository.find({
      where: { courseId },
      relations: ['author'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async getThread(threadId: string) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: ['author'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const replies = await this.replyRepository.find({
      where: { threadId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return {
      ...thread,
      replies,
    };
  }

  async addReply(threadId: string, userId: number, dto: CreateReplyDto) {
    const thread = await this.threadRepository.findOne({ where: { id: threadId } });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const reply = this.replyRepository.create({
      threadId,
      authorId: userId,
      content: dto.content,
    });

    return this.replyRepository.save(reply);
  }

  async sendMessage(senderId: number, dto: SendDirectMessageDto) {
    if (senderId === dto.recipientId) {
      throw new BadRequestException('You cannot send a message to yourself');
    }

    const message = this.messageRepository.create({
      senderId,
      recipientId: dto.recipientId,
      body: dto.body,
      isRead: false,
    });

    return this.messageRepository.save(message);
  }

  async getInbox(userId: number) {
    return this.messageRepository.find({
      where: { recipientId: userId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });
  }

  async getConversation(userId: number, otherUserId: number) {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .where('(message.senderId = :userId AND message.recipientId = :otherUserId)', {
        userId,
        otherUserId,
      })
      .orWhere('(message.senderId = :otherUserId AND message.recipientId = :userId)', {
        userId,
        otherUserId,
      })
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async markMessageAsRead(messageId: string, userId: number) {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException('You can only mark your own incoming messages as read');
    }

    message.isRead = true;
    return this.messageRepository.save(message);
  }
}