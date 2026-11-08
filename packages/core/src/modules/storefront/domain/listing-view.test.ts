import { describe, expect, it } from 'vitest';
import { ACCESS_LEVELS } from './access-level.ts';
import { projectVehicleListing } from './listing-view.ts';
import { makeListing, makeVehicle } from '../../../in-memory/fixtures.ts';

const listing = makeListing();
const vehicle = makeVehicle();

describe('projectVehicleListing', () => {
  it('shows photos-level basics to anonymous visitors and nothing more', () => {
    const view = projectVehicleListing(listing, vehicle, 'anonymous');

    expect(view).toMatchObject({
      title: listing.title,
      price: listing.price,
      brandId: 1,
      year: 2019,
    });
    expect(view).not.toHaveProperty('transmission');
    expect(view).not.toHaveProperty('colorId');
    expect(view).not.toHaveProperty('plate');
  });

  it('adds the full spec for registered users but still hides the plate', () => {
    const view = projectVehicleListing(listing, vehicle, 'registered');

    expect(view).toMatchObject({
      transmission: 'automatic',
      fuel: 'gasoline',
      colorId: 3,
      versionId: 100,
    });
    expect(view).not.toHaveProperty('plate');
  });

  it('reveals the plate once the deposit is paid', () => {
    expect(projectVehicleListing(listing, vehicle, 'deposit_paid')).toMatchObject({
      plate: 'KNT482',
    });
    expect(projectVehicleListing(listing, vehicle, 'closed')).toMatchObject({ plate: 'KNT482' });
  });

  it('never exposes the owner at any level', () => {
    for (const level of ACCESS_LEVELS) {
      const view = projectVehicleListing(listing, vehicle, level);
      expect(view).not.toHaveProperty('ownerId');
      expect(JSON.stringify(view)).not.toContain(listing.ownerId);
    }
  });
});
