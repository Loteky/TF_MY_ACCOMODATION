import { PrismaClient, Role, RentCycle, ListingStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.transfer.deleteMany({}),
    prisma.interest.deleteMany({}),
    prisma.listing.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  const admin = await prisma.user.create({
    data: {
      official_email: 'admin@navy.mil.ng',
      full_name: 'Commodore Ada Admin',
      rank: 'Commodore',
      station: 'Naval HQ',
      role: Role.ADMIN,
      service_number_hash: await argon2.hash('ADM001'),
      phone: '+2348000000001',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      official_email: 'moderator@navy.mil.ng',
      full_name: 'Commander Musa Moderator',
      rank: 'Commander',
      station: 'Naval HQ',
      role: Role.MODERATOR,
      service_number_hash: await argon2.hash('MOD001'),
      phone: '+2348000000002',
    },
  });

  const officer = await prisma.user.create({
    data: {
      official_email: 'officer@navy.mil.ng',
      full_name: 'Lieutenant Sola Officer',
      rank: 'Lieutenant',
      station: 'Naval Dockyard',
      role: Role.OFFICER,
      service_number_hash: await argon2.hash('OFF001'),
      phone: '+2348000000003',
    },
  });

  await prisma.listing.create({
    data: {
      owner_id: officer.id,
      title: 'Seaside Officers Quarters',
      city: 'Lagos',
      state: 'Lagos',
      base: 'Naval Dockyard',
      geo_area: 'Victoria Island',
      rent_amount: 2500000,
      rent_currency: 'NGN',
      rent_cycle: RentCycle.yearly,
      deposit_amount: 500000,
      bedrooms: 3,
      bathrooms: 2,
      furnished: true,
      amenities: ['Generator', 'Secure Parking', 'Sea View'],
      exact_address_enc: Buffer.from('12 Marina Close, Victoria Island', 'utf-8').toString('base64'),
      available_from: dayjs().add(1, 'month').toDate(),
      next_rent_due: dayjs().add(13, 'month').toDate(),
      photos: ['https://example.com/photo1.jpg'],
      status: ListingStatus.published,
    },
  });

  console.log('Seed data loaded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
