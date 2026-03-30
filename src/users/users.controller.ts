import { Controller, Get, Patch, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(page ? +page : 1, limit ? +limit : 10);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateData);
  }

  @ApiOperation({ summary: 'Change current user password' })
  @Patch('me/password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() passwordData: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, passwordData);
  }

  @ApiOperation({ summary: 'Get specific user profile (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.usersService.changeRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Deactivate user account (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Patch(':id/deactivate')
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.setActive(id, false);
  }

  @ApiOperation({ summary: 'Reactivate user account (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Patch(':id/activate')
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.setActive(id, true);
  }
}
