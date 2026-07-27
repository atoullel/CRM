import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CURRENT_ORGANIZATION_ID } from '../common/constants/organization.constant';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.column.findMany({
      where: {
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async create(dto: CreateColumnDto) {
    const lastColumn = await this.prisma.column.findFirst({
      where: {
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const nextPosition = lastColumn ? lastColumn.position + 1 : 1;

    return this.prisma.column.create({
      data: {
        organizationId: CURRENT_ORGANIZATION_ID,
        name: dto.name,
        type: dto.type,
        position: nextPosition,
      },
    });
  }

  async update(id: number, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findFirst({
      where: {
        id,
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return this.prisma.column.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: number) {
    const column = await this.prisma.column.findFirst({
      where: {
        id,
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return this.prisma.column.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}