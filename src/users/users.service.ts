import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.userRepo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email }, select: ['id', 'email', 'password', 'role', 'isActive', 'firstName', 'lastName', 'isVerified'] });
  }

  async updateProfile(id: number, updateData: UpdateProfileDto) {
    await this.userRepo.update(id, updateData);
    return this.findById(id);
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'password'] });
    if (!user) throw new NotFoundException('User not found');

    const isMatched = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatched) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.update(id, { password: hashedNewPassword });
    return { message: 'Password changed successfully' };
  }

  async changeRole(id: number, role: UserRole) {
    await this.userRepo.update(id, { role });
    return this.findById(id);
  }

  async setActive(id: number, isActive: boolean) {
    await this.userRepo.update(id, { isActive });
    return this.findById(id);
  }

  async countByRole(role: UserRole) {
    return await this.userRepo.count({ where: { role } });
  }

  async countAll() {
    return await this.userRepo.count();
  }
}
