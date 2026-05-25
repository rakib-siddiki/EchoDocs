import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend');

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new ClerkAuthGuard(reflector);
  });

  it('should allow public routes', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
    const context = {
      getHandler: () => {},
      getClass: () => {},
    } as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw 401 if auth header is missing', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const request = {
      headers: {},
    };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should throw 401 if auth header is not Bearer', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const request = {
      headers: {
        authorization: 'Basic token',
      },
    };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should verify valid token and attach user to request', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const mockPayload = { sub: 'user_123', metadata: { role: 'viewer' } };
    (clerkBackend.verifyToken as jest.Mock).mockResolvedValue(mockPayload);

    const request = {
      headers: {
        authorization: 'Bearer valid_token',
      },
      user: undefined,
    } as any;
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual(mockPayload);
  });

  it('should throw 401 if verifyToken throws', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    (clerkBackend.verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    const request = {
      headers: {
        authorization: 'Bearer invalid_token',
      },
    };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
