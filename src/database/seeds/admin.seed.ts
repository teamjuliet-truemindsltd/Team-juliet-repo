import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  console.log('Starting admin seeder...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const adminEmail = 'admin@trueminds.io';

  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Admin user with email ${adminEmail} already exists. Skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    const admin = userRepo.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepo.save(admin);
    console.log(`Admin user created!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: superadmin123`);
  }

  await app.close();
  console.log('Seeder completed.');
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeder failed:', err);
    process.exit(1);
  });
