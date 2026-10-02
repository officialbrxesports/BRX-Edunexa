import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

import { FeatureGuard } from '../../permissions/guards/feature.guard';
import { RequireFeature } from '../../permissions/decorators/feature.decorator';

import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { MarkNotificationDto } from '../dto/mark-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles('HEAD', 'TEACHER', 'STAFF')
  create(@Req() req: any, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(
      req.user.institutionId,
      req.user.userId,
      dto,
    );
  }

  @Post('broadcast')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  broadcast(
    @Req() req: any,
    @Body() dto: BroadcastNotificationDto,
  ) {
    return this.notificationsService.broadcast(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Get()
  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  listMine(
    @Req() req: any,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listMine(
      req.user.institutionId,
      req.user.userId,
      query,
    );
  }

  @Get('unread-count')
  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  unreadCount(@Req() req: any) {
    return this.notificationsService.unreadCount(
      req.user.institutionId,
      req.user.userId,
    );
  }

  @Patch(':notificationId/read')
  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  markRead(
    @Req() req: any,
    @Param('notificationId') notificationId: string,
    @Body() dto: MarkNotificationDto,
  ) {
    return this.notificationsService.markRead(
      req.user.institutionId,
      req.user.userId,
      notificationId,
      dto.isRead,
    );
  }

  @Patch('read-all')
  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(
      req.user.institutionId,
      req.user.userId,
    );
  }

  @Delete(':notificationId')
  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  remove(
    @Req() req: any,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.remove(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      notificationId,
    );
  }
}
