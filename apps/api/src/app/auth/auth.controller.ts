import { Controller, Post, Get, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { RegisterDto, LoginDto } from './dto';

@Throttle({ default: { limit: 20, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Req() request: Request,
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const { email, password } = registerDto;
    const result = await this.authService.register(email, password);

    const isSecure = request.secure || request.headers['x-forwarded-proto'] === 'https';

    // Set refresh token in httpOnly cookie
    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });

    return {
      user: result.user,
      token: result.accessToken,
    };
  }

  @Public()
  @Post('login')
  async login(
    @Req() request: Request,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const { email, password } = loginDto;
    const result = await this.authService.login(email, password);

    const isSecure = request.secure || request.headers['x-forwarded-proto'] === 'https';

    // Set refresh token in httpOnly cookie
    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });

    return {
      user: result.user,
      token: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    const isSecure = request.secure || request.headers['x-forwarded-proto'] === 'https';

    // Set new rotated refresh token in httpOnly cookie
    response.cookie('refresh_token', result.newRefreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });

    return {
      token: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const isSecure = request.secure || request.headers['x-forwarded-proto'] === 'https';
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    // req.user is set by JwtAuthGuard
    return this.authService.validateUser(req.user.id);
  }
}
