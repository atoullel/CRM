import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

import { CURRENT_ORGANIZATION_ID } from '../common/constants/organization.constant';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page = 1, pageSize = 50 }: PaginationQueryDto) {
    const skip = (page - 1) * pageSize;

    const where = {
      organizationId: CURRENT_ORGANIZATION_ID,
      deletedAt: null,
    };

    // Run in parallel via $transaction instead of two sequential round-trips.
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
      data: contacts.map((contact) => {
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
      }),
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

    return this.prisma.contact.create({
      data: {
        organizationId: CURRENT_ORGANIZATION_ID,
        ...contactData,
        dateJoined: this.parseDate(dateJoined),
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
      include: { values: true },
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

    const parsedDateJoined =
      dateJoined !== undefined ? this.parseDate(dateJoined) : undefined;

    // Single transaction: contact update + all dynamicValue upserts either
    // all succeed or all roll back. Also runs concurrently
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
          update: { value },
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
      data: { deletedAt: new Date() },
    });
  }

  // Re-validates the ISO date string as a real Date. IsDateString on the
  // DTO checks the string *format*; this catches anything that's
  // syntactically ISO-ish but not an actual calendar date, and converts
  // to the Date instance Prisma expects.
  private parseDate(dateJoined?: string): Date | undefined {
    if (dateJoined === undefined) {
      return undefined;
    }

    const parsed = new Date(dateJoined);

    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('dateJoined must be a valid date');
    }

    return parsed;
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
