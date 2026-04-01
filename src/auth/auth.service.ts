import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto, ResendOtpDto } from './dto/otp.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { UsersService } from '../users/users.service';
import { OutboxService } from '../outbox/outbox.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Otp)
    private otpRepo: Repository<Otp>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private dataSource: DataSource,
    private outboxService: OutboxService,
  ) { }

  async register(dto: RegisterDto) {
    const { firstName, lastName, email, password, role } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Using Transactional Outbox Pattern
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const user = manager.create(User, {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
      });

      await manager.save(user);

      // Generate and save OTP & Outbox event atomically
      await this.generateAndSendOtp(user.email, manager);
    });

    return {
      message: 'Registration successful. Please check your email for the verification code.',
      email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, code } = dto;

    const otp = await this.otpRepo.findOne({
      where: { email, code, purpose: 'VERIFY_EMAIL' },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isVerified = true;
    await this.userRepo.save(user);

    // Delete all verification OTPs for this email after successful verification
    await this.otpRepo.delete({ email, purpose: 'VERIFY_EMAIL' });

    return {
      message: 'Email successfully verified. You can now log in.',
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await this.generateAndSendOtp(email, manager, 'VERIFY_EMAIL');
    });

    return {
      message: 'A new verification code has been sent to your email.',
    };
  }

  private async generateAndSendOtp(email: string, manager?: EntityManager, purpose: string = 'VERIFY_EMAIL') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const otpRepo = manager ? manager.getRepository(Otp) : this.otpRepo;

    // Save OTP to DB
    const otp = otpRepo.create({
      email,
      code,
      expiresAt,
      purpose,
    });
    await otpRepo.save(otp);

    // Add task to Outbox inside the same transaction
    const eventType = purpose === 'RESET_PASSWORD' ? 'PASSWORD_RESET_EMAIL' : 'OTP_EMAIL';
    await this.outboxService.add(eventType, { email, code }, manager);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Note: To prevent email enumeration, we usually return a success message even if the user doesn't exist.
    // However, for this implementation, we'll follow standard flow.
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await this.generateAndSendOtp(user.email, manager, 'RESET_PASSWORD');
    });

    return {
      message: 'Password reset code sent to your email.',
      email: user.email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;

    const otp = await this.otpRepo.findOne({
      where: { email, code, purpose: 'RESET_PASSWORD' },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Reset code has expired');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    // Delete all reset OTPs for this email after successful reset
    await this.otpRepo.delete({ email, purpose: 'RESET_PASSWORD' });

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
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

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email address before logging in');
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
