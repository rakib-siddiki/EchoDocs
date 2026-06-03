import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as utils from './utils';

jest.mock('./utils');

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(reflector);
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
    const mockPayload = { id: 'user_123', email: 'test@example.com', role: 'viewer' };
    (utils.verifyJwt as jest.Mock).mockReturnValue(mockPayload);

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

  it('should throw 401 if verifyJwt throws', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    (utils.verifyJwt as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

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
