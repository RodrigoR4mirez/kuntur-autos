/**
 * Autos de ejemplo para mostrar cómo se ve la web mientras no hay anuncios reales ni subida de
 * fotos. Datos inventados; las fotos son de Pexels (licencia gratuita). Nada de esto va a la base.
 */
import { formatMoney } from './listings.ts';
import {
  buildShowroom,
  type CatalogOptions,
  type ListingDetail,
  type ShowroomData,
} from './showroom.ts';

export interface ExamplePhoto {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
  readonly width: number;
  readonly height: number;
}

export interface ExampleCar {
  readonly slug: string;
  readonly detail: ListingDetail;
  readonly photo: ExamplePhoto;
}

const CREDIT = 'Foto de ejemplo de Pexels (licencia gratuita). No es un anuncio real.';

/** Catálogo solo para estos ejemplos (los ids no tocan la base). */
export const EXAMPLE_OPTIONS: CatalogOptions = {
  bodyTypes: [
    { id: 1, name: 'Clásico' },
    { id: 2, name: 'Hatchback' },
    { id: 3, name: 'SUV' },
    { id: 4, name: 'Camioneta pickup' },
  ],
  colors: [
    { id: 1, name: 'Rojo' },
    { id: 2, name: 'Azul' },
    { id: 3, name: 'Plata' },
    { id: 4, name: 'Negro' },
  ],
};

const base = {
  access: 'registered',
  hasServiceHistory: true,
  soatValid: true,
  technicalReviewValid: true,
  hasSpareKey: true,
  hasLiens: false,
  hasAccidents: false,
} as const;

export const EXAMPLES: readonly ExampleCar[] = [
  {
    slug: 'chevrolet-bel-air-1957',
    detail: {
      ...base,
      id: 'ejemplo-bel-air',
      title: 'Chevrolet Bel Air 1957',
      price: { amountMinor: 8_500_000, currency: 'PEN' },
      department: 'Lima',
      city: 'Miraflores',
      year: 1957,
      mileageKm: 82_000,
      transmission: 'manual',
      fuel: 'gasoline',
      bodyTypeId: 1,
      colorId: 1,
      previousOwners: 1,
      description: 'Ejemplo: clásico restaurado, motor V8 original y llantas de franja blanca.',
    },
    photo: {
      src: '/ejemplo/chevrolet-1957.jpg',
      alt: 'Chevrolet Bel Air rojo de 1957 en una exhibición de autos clásicos',
      credit: CREDIT,
      width: 1400,
      height: 934,
    },
  },
  {
    slug: 'mercedes-benz-clase-a-2018',
    detail: {
      ...base,
      id: 'ejemplo-clase-a',
      title: 'Mercedes-Benz Clase A 2018',
      price: { amountMinor: 8_900_000, currency: 'PEN' },
      department: 'Lima',
      city: 'San Isidro',
      year: 2018,
      mileageKm: 41_000,
      transmission: 'automatic',
      fuel: 'gasoline',
      bodyTypeId: 2,
      colorId: 2,
      previousOwners: 1,
      description: 'Ejemplo: hatchback azul, mantenimiento en concesionaria y llantas de aleación.',
    },
    photo: {
      src: '/ejemplo/mercedes-clase-a-2018.jpg',
      alt: 'Mercedes-Benz Clase A azul estacionado frente a una estructura metálica',
      credit: CREDIT,
      width: 1400,
      height: 930,
    },
  },
  {
    slug: 'toyota-rav4-2014',
    detail: {
      ...base,
      id: 'ejemplo-rav4',
      title: 'Toyota RAV4 2014',
      price: { amountMinor: 5_600_000, currency: 'PEN' },
      department: 'Arequipa',
      city: 'Cayma',
      year: 2014,
      mileageKm: 96_000,
      transmission: 'automatic',
      fuel: 'gasoline',
      bodyTypeId: 3,
      colorId: 3,
      previousOwners: 2,
      hasSpareKey: false,
      description: 'Ejemplo: SUV familiar plateada, dos dueños y revisiones al día.',
    },
    photo: {
      src: '/ejemplo/toyota-rav4-2014.jpg',
      alt: 'Toyota RAV4 plateada frente a montañas con nieve',
      credit: CREDIT,
      width: 1400,
      height: 788,
    },
  },
  {
    slug: 'ram-1500-2021',
    detail: {
      ...base,
      id: 'ejemplo-ram',
      title: 'RAM 1500 2021',
      price: { amountMinor: 21_000_000, currency: 'USD' },
      department: 'Lima',
      city: 'Surco',
      year: 2021,
      mileageKm: 28_000,
      transmission: 'automatic',
      fuel: 'gasoline',
      bodyTypeId: 4,
      colorId: 4,
      previousOwners: 1,
      description: 'Ejemplo: pickup negra de uso particular, sin choques declarados.',
    },
    photo: {
      src: '/ejemplo/ram-1500-2021.jpg',
      alt: 'Camioneta pickup RAM 1500 negra sobre nieve frente a un almacén',
      credit: CREDIT,
      width: 1400,
      height: 935,
    },
  },
  {
    slug: 'suzuki-s-cross-2019',
    detail: {
      ...base,
      id: 'ejemplo-s-cross',
      title: 'Suzuki S-Cross 2019',
      price: { amountMinor: 6_200_000, currency: 'PEN' },
      department: 'La Libertad',
      city: 'Trujillo',
      year: 2019,
      mileageKm: 54_000,
      transmission: 'manual',
      fuel: 'gasoline',
      bodyTypeId: 3,
      colorId: 3,
      previousOwners: 1,
      hasAccidents: null,
      description: 'Ejemplo: crossover plateado, un solo dueño, choques sin informar.',
    },
    photo: {
      src: '/ejemplo/suzuki-s-cross-2019.jpg',
      alt: 'Frente de una Suzuki S-Cross plateada con los faros encendidos',
      credit: CREDIT,
      width: 1400,
      height: 1082,
    },
  },
];

export function findExample(slug: string): ExampleCar | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}

export function exampleShowroom(car: ExampleCar): ShowroomData {
  return buildShowroom(car.detail, EXAMPLE_OPTIONS);
}

export function exampleCardData(car: ExampleCar) {
  const d = car.detail;
  return {
    id: d.id,
    href: `/ejemplo/${car.slug}`,
    title: d.title,
    year: d.year,
    mileageKm: d.mileageKm,
    city: d.city,
    department: d.department,
    price: d.price,
    priceText: formatMoney(d.price),
    photo: { src: car.photo.src, alt: car.photo.alt },
  };
}
