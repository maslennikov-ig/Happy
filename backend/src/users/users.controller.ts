import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    try {
      const user = await this.usersService.getProfile(req.user.id);
      return user;
    } catch {
      throw new NotFoundException('Пользователь не найден');
    }
  }

  @Put('me')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const user = await this.usersService.updateProfile(
        req.user.id,
        updateProfileDto,
      );
      return user;
    } catch {
      throw new NotFoundException('Пользователь не найден');
    }
  }

  @Put('me/password')
  @HttpCode(200)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      await this.usersService.changePassword(req.user.id, changePasswordDto);
      return { message: 'Пароль успешно изменен' };
    } catch {
      throw new UnauthorizedException('Неверный текущий пароль');
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.usersService.findOneById(id);
      return user;
    } catch {
      throw new NotFoundException('Пользователь не найден');
    }
  }
}
