/** Catálogo cerrado: el vendedor elige de estas listas, no escribe texto libre. */
export interface Brand {
  readonly id: number;
  readonly name: string;
}

export interface Model {
  readonly id: number;
  readonly brandId: number;
  readonly name: string;
}

export interface BodyType {
  readonly id: number;
  readonly name: string;
}

export interface Color {
  readonly id: number;
  readonly name: string;
  /** Color de muestra para la interfaz, por ejemplo '#B3261E'. */
  readonly hex: string;
}
