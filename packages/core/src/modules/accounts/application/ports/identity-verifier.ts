export interface IdentityCheck {
  readonly valid: boolean;
  readonly fullName?: string;
}

export interface IdentityVerifier {
  verifyDni(dni: string): Promise<IdentityCheck>;
}
