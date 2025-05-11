import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { CompanyOwnerGuard } from './guards/company-owner.guard';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CheckInvitationDto } from './dto/check-invitation.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Public } from '../auth/decorators/public.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Получить данные компании текущего пользователя
   */
  @Get('my')
  @UseGuards(CompanyOwnerGuard)
  async getMyCompany(@Request() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('Пользователь не привязан к компании');
    }
    return this.companiesService.getCompanyByUserId(req.user.companyId);
  }

  /**
   * Обновить данные компании текущего пользователя
   */
  @Put('my')
  @UseGuards(CompanyOwnerGuard)
  async updateMyCompany(
    @Request() req: RequestWithUser,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    if (!req.user.companyId) {
      throw new BadRequestException('Пользователь не привязан к компании');
    }
    return this.companiesService.updateCompany(
      req.user.companyId,
      updateCompanyDto,
    );
  }

  /**
   * Пригласить сотрудника в компанию
   */
  @Post('my/employees')
  @UseGuards(CompanyOwnerGuard)
  async inviteEmployee(
    @Request() req: RequestWithUser,
    @Body() inviteEmployeeDto: InviteEmployeeDto,
  ) {
    if (!req.user.companyId) {
      throw new BadRequestException('Пользователь не привязан к компании');
    }
    return this.companiesService.inviteEmployee(
      req.user.companyId,
      inviteEmployeeDto,
    );
  }

  /**
   * Получить список сотрудников компании
   */
  @Get('my/employees')
  @UseGuards(CompanyOwnerGuard)
  async getEmployees(@Request() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('Пользователь не привязан к компании');
    }
    return this.companiesService.getEmployees(req.user.companyId);
  }

  /**
   * Удалить сотрудника из компании
   */
  @Delete('my/employees/:employeeId')
  @UseGuards(CompanyOwnerGuard)
  async removeEmployee(
    @Request() req: RequestWithUser,
    @Param('employeeId') employeeId: string,
  ) {
    if (!req.user.companyId) {
      throw new BadRequestException('Пользователь не привязан к компании');
    }
    return this.companiesService.removeEmployee(req.user.companyId, employeeId);
  }

  /**
   * Проверить статус приглашения
   */
  @Public()
  @Post('invitation/check')
  async checkInvitation(@Body() checkInvitationDto: CheckInvitationDto) {
    return this.companiesService.checkInvitation(checkInvitationDto);
  }

  /**
   * Принять приглашение сотрудником
   */
  @Public()
  @Post('invitation/accept')
  async acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.companiesService.acceptInvitation(acceptInvitationDto);
  }
}
