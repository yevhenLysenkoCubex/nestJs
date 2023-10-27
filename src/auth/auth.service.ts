import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
   constructor(
      private prisma: PrismaService,
      private jwt: JwtService,
      private config: ConfigService,
   ) {}

   async signup(dto: AuthDto) {
      const { email, password } = dto;
      // generate hash password
      const hash = await argon.hash(password);

      try {
         const newUser = await this.prisma.user.create({
            data: {
               email,
               hash,
            },
            // select: {
            //    id: true,
            //    email: true,
            //    createdAt: true,
            //    hash: false,
            // },
         });
         delete newUser.hash;
         return newUser;
      } catch (error) {
         if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
               throw new ForbiddenException('Credentials taken');
            }
         }
         throw error;
      }
   }

   async signin(dto: AuthDto) {
      const { email, password } = dto;

      const user = await this.prisma.user.findUnique({
         where: {
            email,
         },
      });
      if (!user) {
         throw new ForbiddenException('Credentials incorrect');
      }

      // compare passwords
      const pwMatches = await argon.verify(user.hash, password);
      if (!pwMatches) {
         throw new ForbiddenException('Credentials incorrect');
      }
      delete user.hash;
      const userData = {
         email: user.email,
      };

      const accessToken = await this.signToken(user.id, user.email);

      return { ...userData, ...accessToken };
   }

   async signToken(userId: number, email: string): Promise<{ accessToken: string }> {
      const payload = {
         sub: userId,
         email,
      };
      const secret = this.config.get('JWT_SECRET');

      const token = await this.jwt.signAsync(payload, {
         expiresIn: '15m',
         secret,
      });

      return {
         accessToken: token,
      };
   }
}
