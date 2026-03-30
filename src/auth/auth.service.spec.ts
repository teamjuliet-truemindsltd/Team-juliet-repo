import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ConflictException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let userRepo: any;

  const mockUser = {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.STUDENT,
    isActive: true,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mockJwtToken'),
    };

    userRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto, password: 'hashed' })),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.STUDENT as const,
    };

    it('should successfully register a user', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await authService.register(dto);
      expect(result.accessToken).toBe('mockJwtToken');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(authService.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should successfully login and return token', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(dto);
      expect(result.accessToken).toBe('mockJwtToken');
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user deactivated', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });
      await expect(authService.login(dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.getMe(1);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      (usersService.findById as jest.Mock).mockRejectedValue(new NotFoundException());
      await expect(authService.getMe(999)).rejects.toThrow(NotFoundException);
    });
  });
});
