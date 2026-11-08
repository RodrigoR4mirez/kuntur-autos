import type { Money } from '../domain/money.ts';

export interface ChargeRequest {
  readonly amount: Money;
  /** Referencia propia, por ejemplo el id de la cita. */
  readonly reference: string;
  readonly customerEmail: string;
  /** Misma clave = mismo resultado, sin cobrar dos veces. */
  readonly idempotencyKey: string;
}

export interface ChargeResult {
  readonly chargeId: string;
  readonly status: 'paid' | 'pending' | 'failed';
}

export interface RefundRequest {
  readonly chargeId: string;
  readonly amount?: Money;
  readonly idempotencyKey: string;
}

export type PaymentEvent =
  | { readonly type: 'charge.paid'; readonly chargeId: string; readonly reference: string }
  | { readonly type: 'charge.failed'; readonly chargeId: string; readonly reference: string }
  | { readonly type: 'refund.completed'; readonly chargeId: string };

export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  refund(request: RefundRequest): Promise<{ readonly status: 'refunded' | 'pending' | 'failed' }>;
  /** Verifica la firma del proveedor. Lanza si no es válida. */
  parseWebhook(rawBody: string, signature: string): Promise<PaymentEvent>;
}
