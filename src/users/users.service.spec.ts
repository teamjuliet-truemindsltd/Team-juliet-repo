import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
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
    userRepo = {
      findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated array of users', async () => {
      const result = await service.findAll(1, 10);
      expect(result.data).toEqual([mockUser]);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      const user = await service.findById(1);
      expect(user).toEqual(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should successfully update password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');

      const res = await service.changePassword(1, { currentPassword: 'old', newPassword: 'new' });
      expect(res.message).toBe('Password changed successfully');
      expect(userRepo.update).toHaveBeenCalledWith(1, { password: 'newHash' });
    });

    it('should throw UnauthorizedException for bad old password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, { currentPassword: 'bad', newPassword: 'new' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changeRole', () => {
    it('should update user role', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, role: UserRole.INSTRUCTOR });
      const user = await service.changeRole(1, UserRole.INSTRUCTOR);
      expect(userRepo.update).toHaveBeenCalledWith(1, { role: UserRole.INSTRUCTOR });
      expect(user.role).toBe(UserRole.INSTRUCTOR);
    });
  });
  
  describe('setActive', () => {
    it('should update user active status', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });
      const user = await service.setActive(1, false);
      expect(userRepo.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(user.isActive).toBe(false);
    });
  });
});
