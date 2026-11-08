/**
 * Muestra inicial del catálogo con las marcas y modelos más comunes en el mercado peruano.
 * Es un punto de partida: hay que curarla (versiones, modelos faltantes, nombres comerciales)
 * antes de abrir el marketplace. Los ids son estables: no los reutilices ni los cambies.
 */
export const BRAND_SEED: readonly { id: number; name: string; models: readonly string[] }[] = [
  { id: 1, name: 'Toyota', models: ['Yaris', 'Corolla', 'Hilux', 'RAV4', 'Rush', 'Fortuner'] },
  { id: 2, name: 'Kia', models: ['Rio', 'Picanto', 'Sportage', 'Cerato', 'Soluto', 'Seltos'] },
  { id: 3, name: 'Hyundai', models: ['Accent', 'Elantra', 'Tucson', 'Creta', 'Grand i10', 'i10'] },
  { id: 4, name: 'Nissan', models: ['Versa', 'Sentra', 'Kicks', 'Frontier', 'March', 'X-Trail'] },
  { id: 5, name: 'Suzuki', models: ['Swift', 'Baleno', 'Vitara', 'Jimny', 'Alto', 'S-Presso'] },
  { id: 6, name: 'Chevrolet', models: ['Sail', 'Spark', 'Onix', 'Tracker', 'Aveo', 'Captiva'] },
  { id: 7, name: 'Mazda', models: ['Mazda2', 'Mazda3', 'CX-3', 'CX-30', 'CX-5', 'BT-50'] },
  { id: 8, name: 'Honda', models: ['Civic', 'CR-V', 'Fit', 'HR-V', 'City', 'Accord'] },
  { id: 9, name: 'Volkswagen', models: ['Gol', 'Polo', 'Tiguan', 'Jetta', 'T-Cross', 'Amarok'] },
  { id: 10, name: 'Mitsubishi', models: ['L200', 'Outlander', 'ASX', 'Montero Sport', 'Mirage'] },
  { id: 11, name: 'Ford', models: ['Ranger', 'EcoSport', 'Escape', 'Explorer', 'Fiesta'] },
  { id: 12, name: 'Renault', models: ['Kwid', 'Duster', 'Logan', 'Sandero', 'Captur', 'Oroch'] },
];

export const BODY_TYPE_SEED: readonly { id: number; name: string }[] = [
  { id: 1, name: 'Sedán' },
  { id: 2, name: 'Hatchback' },
  { id: 3, name: 'SUV' },
  { id: 4, name: 'Camioneta pickup' },
  { id: 5, name: 'Station wagon' },
  { id: 6, name: 'Minivan' },
  { id: 7, name: 'Coupé' },
];

export const COLOR_SEED: readonly { id: number; name: string; hex: string }[] = [
  { id: 1, name: 'Blanco', hex: '#FFFFFF' },
  { id: 2, name: 'Negro', hex: '#111111' },
  { id: 3, name: 'Plata', hex: '#C0C0C0' },
  { id: 4, name: 'Gris', hex: '#808080' },
  { id: 5, name: 'Rojo', hex: '#B3261E' },
  { id: 6, name: 'Azul', hex: '#1F4FD8' },
  { id: 7, name: 'Verde', hex: '#17784A' },
  { id: 8, name: 'Beige', hex: '#D9C9A3' },
  { id: 9, name: 'Marrón', hex: '#6B4423' },
  { id: 10, name: 'Naranja', hex: '#E8791D' },
  { id: 11, name: 'Amarillo', hex: '#F2B33D' },
];
