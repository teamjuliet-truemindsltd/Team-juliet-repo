import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Error sending email', error.stack);
      throw error;
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    const subject = 'Your Verification Code - TrueMinds TalentFlow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to TrueMinds TalentFlow!</h2>
        <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; color: #007bff; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 TrueMinds TalentFlow LMS. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const subject = 'Password Reset Request - TrueMinds TalentFlow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>A request has been made to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; color: #dc3545; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 TrueMinds TalentFlow LMS. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}
