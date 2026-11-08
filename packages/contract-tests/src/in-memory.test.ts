import { InMemoryCatalogRepository, InMemoryListingRepository } from '@kuntur/core/in-memory';
import { catalogRepositoryContract } from './catalog-repository.contract.ts';
import { listingRepositoryContract } from './listing-repository.contract.ts';

listingRepositoryContract('in-memory', async () => new InMemoryListingRepository());
catalogRepositoryContract('in-memory', async () => new InMemoryCatalogRepository());
