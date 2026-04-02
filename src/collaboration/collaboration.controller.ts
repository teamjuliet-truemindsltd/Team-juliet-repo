import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('forum/threads')
  @ApiOperation({ summary: 'Create a forum thread' })
  createThread(@CurrentUser() user: JwtPayload, @Body() dto: CreateThreadDto) {
    return this.collaborationService.createThread(user.sub, dto);
  }

  @Get('forum/threads/course/:courseId')
  @ApiOperation({ summary: 'Get forum threads by course' })
  getThreadsByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.collaborationService.getThreadsByCourse(courseId);
  }

  @Get('forum/threads/:threadId')
  @ApiOperation({ summary: 'Get thread details with replies' })
  getThread(@Param('threadId', ParseUUIDPipe) threadId: string) {
    return this.collaborationService.getThread(threadId);
  }

  @Post('forum/threads/:threadId/replies')
  @ApiOperation({ summary: 'Reply to a forum thread' })
  addReply(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReplyDto,
  ) {
    return this.collaborationService.addReply(threadId, user.sub, dto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a direct message' })
  sendMessage(@CurrentUser() user: JwtPayload, @Body() dto: SendDirectMessageDto) {
    return this.collaborationService.sendMessage(user.sub, dto);
  }

  @Get('messages/inbox')
  @ApiOperation({ summary: 'Get my inbox messages' })
  getInbox(@CurrentUser() user: JwtPayload) {
    return this.collaborationService.getInbox(user.sub);
  }

  @Get('messages/conversation/:otherUserId')
  @ApiOperation({ summary: 'Get conversation with another user' })
  getConversation(
    @CurrentUser() user: JwtPayload,
    @Param('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    return this.collaborationService.getConversation(user.sub, otherUserId);
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  markAsRead(@CurrentUser() user: JwtPayload, @Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.collaborationService.markMessageAsRead(messageId, user.sub);
  }
}