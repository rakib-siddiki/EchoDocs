import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';
import { Roles } from '../auth/decorators';
import { ROLES } from '../constants';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query/stream')
  @Roles(ROLES.ADMIN, ROLES.VIEWER)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async queryStream(@Body() chatQueryDto: ChatQueryDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const event of this.chatService.queryStream(chatQueryDto.query)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        if (event.type === 'done' || event.type === 'error') {
          res.end();
          return;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage || 'Stream processing failed' })}\n\n`);
      res.end();
    }
  }
}
