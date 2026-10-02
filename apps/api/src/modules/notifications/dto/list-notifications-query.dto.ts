import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../../../generated/prisma/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListNotificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
