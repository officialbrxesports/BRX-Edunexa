import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Trim } from '../../../common/dto/trim.decorator';

export class ListStudentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  classId?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  sectionId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'all'])
  userStatus?: 'ACTIVE' | 'INACTIVE' | 'all';
}
