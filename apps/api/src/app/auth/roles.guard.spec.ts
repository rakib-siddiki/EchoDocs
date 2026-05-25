import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow public routes', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return true;
      return undefined;
    });

    const context = {
      getHandler: () => {},
      getClass: () => {},
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow routes with no roles configured', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return [];
      return undefined;
    });

    const context = {
      getHandler: () => {},
      getClass: () => {},
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw 403 if user context is missing', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return ['admin'];
      return undefined;
    });

    const request = {};
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw 403 if user has no assigned role', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return ['admin'];
      return undefined;
    });

    const request = {
      user: {
        sub: 'user_123',
      },
    };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw 403 if user role does not match required roles', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return ['admin'];
      return undefined;
    });

    const request = {
      user: {
        sub: 'user_123',
        metadata: {
          role: 'viewer',
        },
      },
    };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow request if user has matching role', () => {
    reflector.getAllAndOverride = jest.fn().mockImplementation((key) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return ['admin'];
      return undefined;
    });

    const request = {
      user: {
        sub: 'user_123',
        metadata: {
          role: 'admin',
        },
      },
    } as any;
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});
