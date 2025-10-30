import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Naval House Handover E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.GOOGLE_DRIVE_MOCK = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.transfer.deleteMany({});
    await prisma.interest.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs the full accommodation transfer flow', async () => {
    const officer1Register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        service_number: 'OFF100',
        official_email: 'officer100@navy.mil.ng',
        full_name: 'Officer One Hundred',
        rank: 'Lieutenant',
        station: 'Naval Base',
      })
      .expect(201);

    const officer1Token = officer1Register.body.tokens.access_token;
    const officer1Id = officer1Register.body.officer.id;

    await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ service_number: 'OFF100', official_email: 'officer100@navy.mil.ng' })
      .expect(201);

    const listingResponse = await request(app.getHttpServer())
      .post('/listings')
      .set('Authorization', `Bearer ${officer1Token}`)
      .send({
        title: 'Ocean View Duplex',
        city: 'Lagos',
        state: 'Lagos',
        base: 'Naval Base',
        geo_area: 'Ikoyi',
        rent_amount: 500000,
        rent_currency: 'NGN',
        rent_cycle: 'monthly',
        deposit_amount: 100000,
        bedrooms: 4,
        bathrooms: 3,
        furnished: true,
        amenities: ['Air Conditioning'],
        exact_address: '1 Admiralty Way',
        available_from: new Date().toISOString(),
        next_rent_due: new Date().toISOString(),
        photos: ['mock-photo'],
      })
      .expect(201);

    const listingId = listingResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${officer1Token}`)
      .send({ status: 'published' })
      .expect(200);

    const officer2Register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        service_number: 'OFF200',
        official_email: 'officer200@navy.mil.ng',
        full_name: 'Officer Two Hundred',
        rank: 'Lieutenant',
        station: 'Naval Yard',
      })
      .expect(201);

    const officer2Token = officer2Register.body.tokens.access_token;
    const officer2Id = officer2Register.body.officer.id;

    const interestResponse = await request(app.getHttpServer())
      .post('/interests')
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ listing_id: listingId, message: 'Requesting occupancy approval' })
      .expect(201);

    const interestId = interestResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/interests/${interestId}/status`)
      .set('Authorization', `Bearer ${officer1Token}`)
      .send({ status: 'accepted' })
      .expect(200);

    const transferResponse = await request(app.getHttpServer())
      .post('/transfers')
      .set('Authorization', `Bearer ${officer1Token}`)
      .send({
        listing_id: listingId,
        to_officer_id: officer2Id,
        proposed_move_in: new Date().toISOString(),
      })
      .expect(201);

    const transferId = transferResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/transfers/${transferId}/status`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ status: 'approved' })
      .expect(200);

    const uploadResponse = await request(app.getHttpServer())
      .post('/upload/image')
      .set('Authorization', `Bearer ${officer1Token}`)
      .attach('file', Buffer.from('photo-bytes'), 'evidence.jpg')
      .expect(201);

    expect(uploadResponse.body.google_drive_link).toContain('mock://');
  });
});
