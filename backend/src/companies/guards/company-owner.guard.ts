import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

@Injectable()
export class CompanyOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }

    if (!user.companyId) {
      throw new ForbiddenException('У пользователя нет компании');
    }

    return true;
  }
}
