import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ColumnType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

import { CURRENT_ORGANIZATION_ID } from '../common/constants/organization.constant';

import {
  isValidNumber,
  isValidPhone,
  isValidText,
  isValidInteger,
  parseDate,
} from '../common/validators/field-value.validator';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page = 1, pageSize = 50 }: PaginationQueryDto) {
    const skip = (page - 1) * pageSize;

    const where = {
      organizationId: CURRENT_ORGANIZATION_ID,
      deletedAt: null,
    };

    const [contacts, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: { values: true },
        skip,
        take: pageSize,
        orderBy: { id: 'asc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts.map((contact) => this.formatContact(contact)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
      include: { values: true },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async create(dto: CreateContactDto) {
    const { dynamicValues, dateJoined, ...contactData } = dto;

    this.validateFixedFields(contactData, dateJoined);

    await this.validateDynamicValues(dynamicValues);

    return this.prisma.contact.create({
      data: {
        organizationId: CURRENT_ORGANIZATION_ID,
        ...contactData,
        dateJoined: dateJoined ? parseDate(dateJoined) : undefined,

        values: dynamicValues
          ? {
              create: Object.entries(dynamicValues).map(
                ([columnId, value]) => ({
                  columnId: Number(columnId),
                  value,
                }),
              ),
            }
          : undefined,
      },
      include: {
        values: true,
      },
    });
  }

  async update(id: number, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const { dynamicValues, dateJoined, ...contactData } = dto;

    this.validateFixedFields(contactData, dateJoined);

    await this.validateDynamicValues(dynamicValues);

    const parsedDateJoined =
      dateJoined !== undefined ? parseDate(dateJoined) : undefined;

    await this.prisma.$transaction([
      this.prisma.contact.update({
        where: { id },
        data: {
          ...contactData,
          ...(parsedDateJoined !== undefined && {
            dateJoined: parsedDateJoined,
          }),
        },
      }),

      ...Object.entries(dynamicValues ?? {}).map(([columnId, value]) =>
        this.prisma.contactValue.upsert({
          where: {
            contactId_columnId: {
              contactId: id,
              columnId: Number(columnId),
            },
          },
          update: {
            value,
          },
          create: {
            contactId: id,
            columnId: Number(columnId),
            value,
          },
        }),
      ),
    ]);

    return this.formatContact(await this.findOne(id));
  }

  async remove(id: number) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private async validateDynamicValues(
    dynamicValues?: Record<string, string>,
  ): Promise<void> {
    if (!dynamicValues || Object.keys(dynamicValues).length === 0) {
      return;
    }

    const columnIds = Object.keys(dynamicValues).map(Number);

    const columns = await this.prisma.column.findMany({
      where: {
        id: {
          in: columnIds,
        },
        organizationId: CURRENT_ORGANIZATION_ID,
        deletedAt: null,
      },
    });

    const columnMap = new Map(columns.map((column) => [column.id, column]));

    for (const [columnId, value] of Object.entries(dynamicValues)) {
      const column = columnMap.get(Number(columnId));

      if (!column) {
        throw new BadRequestException(`Column ${columnId} does not exist`);
      }

      this.assertValueMatchesType(column.type, value, column.name);
    }
  }

  private validateFixedFields(
    data: Partial<CreateContactDto>,
    dateJoined?: string,
  ) {
    if (data.nom !== undefined && !isValidText(data.nom)) {
      throw new BadRequestException('nom cannot be empty');
    }

    if (data.entreprise !== undefined && !isValidText(data.entreprise)) {
      throw new BadRequestException('entreprise cannot be empty');
    }

    if (data.telephone !== undefined && !isValidPhone(data.telephone)) {
      throw new BadRequestException('telephone must be a valid phone number');
    }

    if (dateJoined !== undefined) {
      parseDate(dateJoined);
    }

    if (data.score !== undefined && !isValidInteger(data.score)) {
      throw new BadRequestException('score must be an integer');
    }
  }

  private assertValueMatchesType(
    type: ColumnType,
    value: string,
    fieldName: string,
  ) {
    switch (type) {
      case ColumnType.NUMBER:
        if (!isValidNumber(value)) {
          throw new BadRequestException(`${fieldName} must be a number`);
        }
        break;

      case ColumnType.DATE:
        parseDate(value, fieldName);
        break;

      case ColumnType.PHONE:
        if (!isValidPhone(value)) {
          throw new BadRequestException(
            `${fieldName} must be a valid phone number`,
          );
        }
        break;

      case ColumnType.TEXT:
        if (!isValidText(value)) {
          throw new BadRequestException(`${fieldName} cannot be empty`);
        }
        break;
    }
  }

  private formatContact(contact: any) {
    const dynamicValues = contact.values.reduce(
      (acc, item) => {
        acc[item.columnId] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      id: contact.id,
      nom: contact.nom,
      entreprise: contact.entreprise,
      telephone: contact.telephone,
      dateJoined: contact.dateJoined,
      score: contact.score,
      dynamicValues,
    };
  }
}
