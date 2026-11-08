export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ListingId = Brand<string, 'ListingId'>;
export type UserId = Brand<string, 'UserId'>;
export type AppointmentId = Brand<string, 'AppointmentId'>;
