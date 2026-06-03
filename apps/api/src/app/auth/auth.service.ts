import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { hashPassword, verifyPassword, signJwt } from './utils';
import { ROLES, type TAuthRole } from '../constants';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    email: string,
    password: string,
    role: TAuthRole = ROLES.VIEWER,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        role,
      },
    });

    // Create a JWT token for the registered user
    const token = signJwt({ id: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const emailLower = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = signJwt({ id: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
