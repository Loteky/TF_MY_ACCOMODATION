import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: {
    service_number_hash: string;
    official_email: string;
    full_name: string;
    rank: string;
    station: string;
    phone?: string;
    role?: Role;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role ?? 'OFFICER',
      },
    });
  }

  async findByOfficialEmail(official_email: string) {
    return this.prisma.user.findUnique({ where: { official_email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Officer not found');
    }
    return user;
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async listUsers() {
    return this.prisma.user.findMany({ orderBy: { created_at: 'desc' } });
  }
}
