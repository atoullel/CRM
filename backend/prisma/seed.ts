import { PrismaClient, ColumnType } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const firstNames = [
  'Jean',
  'Marie',
  'Thomas',
  'Claire',
  'Lucas',
  'Emma',
  'Hugo',
  'Sophie',
  'Louis',
  'Camille',
];
const lastNames = [
  'Dupont',
  'Martin',
  'Bernard',
  'Robert',
  'Petit',
  'Durand',
  'Moreau',
  'Simon',
  'Laurent',
  'Leroy',
];
const companies = [
  'NovaTech',
  'BlueLabs',
  'Acme',
  'Rodium',
  'Digital Factory',
  'Future Systems',
  'CloudWorks',
  'InnovateX',
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomScore(): number {
  return Math.floor(Math.random() * 100);
}

function randomDate(): Date {
  const start = new Date(2023, 0, 1);
  const end = new Date(2026, 0, 1);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Fix #1: contacts must carry organizationId — the brief specifies it should
// be hardcoded/set even though nullable, not omitted (see "Multi-tenancy" section).
function generateContact(index: number, organizationId: number) {
  return {
    organizationId,
    nom: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
    entreprise: randomItem(companies),
    telephone: `+331${String(index).padStart(8, '0')}`,
    dateJoined: randomDate(),
    score: randomScore(),
  };
}

function generateColumnValue(type: ColumnType): string {
  switch (type) {
    case ColumnType.TEXT:
      return randomItem([
        'Referral',
        'Website',
        'LinkedIn',
        'Conference',
        'Cold outreach',
      ]);
    case ColumnType.NUMBER:
      return String(Math.floor(Math.random() * 100));
    case ColumnType.DATE:
      return randomDate().toISOString().split('T')[0];
    case ColumnType.PHONE:
      return `+336${Math.floor(10000000 + Math.random() * 90000000)}`;
    default:
      // Fix #3: warn instead of silently writing "" for any ColumnType
      // added to the enum later without a matching generator here.
      console.warn(`⚠️  No generator for ColumnType: ${type} — writing ""`);
      return '';
  }
}

async function main() {
  console.log('🌱 Starting database seed...');

  /*
   * Fix #2: idempotent cleanup. Child rows first, then parents, so this
   * script can be re-run without piling up duplicate orgs/contacts.
   * Hard-delete here is fine: ContactValue has no soft-delete (brief treats
   * hard-delete as acceptable for it), and this is dev seed data, not a
   * soft-delete/restore flow the app itself would use.
   */
  await prisma.contactValue.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.column.deleteMany();
  await prisma.organization.deleteMany();
  console.log('🧹 Cleared existing seed data');

  /*
   * Organization
   */
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
    },
  });
  console.log(`Created organization: ${organization.name}`);

  /*
   * Dynamic columns
   */
  const columns = await Promise.all([
    prisma.column.create({
      data: {
        organizationId: organization.id,
        name: 'Lead Source',
        type: ColumnType.TEXT,
        position: 1,
      },
    }),
    prisma.column.create({
      data: {
        organizationId: organization.id,
        name: 'Priority Score',
        type: ColumnType.NUMBER,
        position: 2,
      },
    }),
    prisma.column.create({
      data: {
        organizationId: organization.id,
        name: 'Follow Up Date',
        type: ColumnType.DATE,
        position: 3,
      },
    }),
    prisma.column.create({
      data: {
        organizationId: organization.id,
        name: 'Secondary Phone',
        type: ColumnType.PHONE,
        position: 4,
      },
    }),
  ]);
  console.log(`Created ${columns.length} columns`);

  /*
   * Contacts
   */
  const contacts = await prisma.contact.createManyAndReturn({
    data: Array.from({ length: 500 }, (_, index) =>
      generateContact(index + 1, organization.id),
    ),
  });
  console.log(`Created ${contacts.length} contacts`);

  /*
   * Contact values
   */
  const contactValues = contacts.flatMap((contact) =>
    columns.map((column) => ({
      contactId: contact.id,
      columnId: column.id,
      value: generateColumnValue(column.type),
    })),
  );
  await prisma.contactValue.createMany({
    data: contactValues,
  });
  console.log(`Created ${contactValues.length} contact values`);

  console.log('✅ Seed completed successfully');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
