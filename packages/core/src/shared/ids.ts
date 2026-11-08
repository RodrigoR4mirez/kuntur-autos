export type Branded<T, B extends string> = T & { readonly __brand: B };

export type ListingId = Branded<string, 'ListingId'>;
export type UserId = Branded<string, 'UserId'>;
export type AppointmentId = Branded<string, 'AppointmentId'>;
