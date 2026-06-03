import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';
import { Roles } from '../auth/decorators';
import { ROLES } from '../constants';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  @Roles(ROLES.ADMIN, ROLES.VIEWER)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async query(@Body() chatQueryDto: ChatQueryDto) {
    return this.chatService.query(chatQueryDto.query, chatQueryDto.sessionId);
  }
}
