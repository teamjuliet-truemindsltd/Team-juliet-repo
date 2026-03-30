import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const { firstName, lastName, email, password, role } = dto;
    
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role, // already validated as 'student' or 'instructor'
    });
    
    await this.userRepo.save(user);

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated');
    }

    const isMatched = await bcrypt.compare(dto.password, user.password);
    if (!isMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    };
  }

  async getMe(id: number) {
    try {
      return await this.usersService.findById(id);
    } catch (error) {
       throw new NotFoundException('User profile not found');
    }
  }
}
