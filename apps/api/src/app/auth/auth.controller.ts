import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, role } = registerDto;
    return this.authService.register(email, password, role);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    // req.user is set by JwtAuthGuard
    return this.authService.validateUser(req.user.id);
  }
}
