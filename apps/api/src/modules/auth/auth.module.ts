import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';

import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { PasswordResetService } from './services/password-reset.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import { GoogleAuthService } from './google/google-auth.service';

@Module({
  imports: [
    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.getOrThrow<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    PasswordService,
    PasswordResetService,
    JwtStrategy,
    GoogleAuthService,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    GoogleAuthService,
  ],
})
export class AuthModule {}