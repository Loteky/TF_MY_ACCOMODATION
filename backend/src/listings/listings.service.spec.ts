import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ListingsService', () => {
  const prisma = {
    listing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new ListingsService(prisma);

  const listing = {
    id: 'listing-1',
    owner_id: 'owner-1',
    exact_address_enc: Buffer.from('Top Secret Street', 'utf-8').toString('base64'),
  } as any;

  it('redacts address for unauthorised viewer', () => {
    const redacted = service.redactListing(listing, { id: 'other', role: 'OFFICER' });
    expect(redacted.exact_address).toContain('REDACTED');
  });

  it('reveals address to owner', () => {
    const result = service.redactListing(listing, { id: 'owner-1', role: 'OFFICER' });
    expect(result.exact_address).toBe('Top Secret Street');
  });

  it('reveals address to admin', () => {
    const result = service.redactListing(listing, { id: 'admin', role: 'ADMIN' });
    expect(result.exact_address).toBe('Top Secret Street');
  });
});
