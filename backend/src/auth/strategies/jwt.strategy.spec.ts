import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'JWT_SECRET') {
                return 'test-secret';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user payload', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'CLIENT',
        companyId: '123',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'CLIENT',
        companyId: '123',
      });
    });

    it('should return user payload without companyId', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN',
        companyId: undefined,
      });
    });
  });
}); 