/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure trust proxy for rate limiting (behind reverse proxies)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  
  // Use cookie-parser middleware
  app.use(cookieParser());
  
  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    Logger.log(`[${req.method}] ${req.originalUrl || req.url}`, 'HTTP');
    next();
  });

  
  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Enable CORS to allow the frontend to make API calls
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.API_PORT || process.env.PORT || 5000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: ${process.env.NEXT_PUBLIC_API_URL}`,
  );
}

bootstrap();
