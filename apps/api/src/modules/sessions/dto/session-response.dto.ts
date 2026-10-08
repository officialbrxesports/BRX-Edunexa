export class SessionResponseDto {
  id!: string;

  deviceType!: string;

  deviceName!: string;

  browser!: string;

  os!: string;

  ipAddress!: string | null;

  createdAt!: Date;

  lastActiveAt!: Date;

  expiresAt!: Date;

  isCurrent!: boolean;

  isActive!: boolean;
}