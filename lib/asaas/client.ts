/**
 * Cliente HTTP para a API Asaas v3.
 * Documentação: https://docs.asaas.com
 *
 * Cada chamada recebe a apiKey explicitamente para suportar multi-tenant
 * (cada escritório pode ter sua própria conta Asaas).
 */

export type AsaasEnvironment = "sandbox" | "production";

const BASE_URLS: Record<AsaasEnvironment, string> = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
};

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "CANCELED"
  | "CHARGEBACK_REQUESTED"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "IN_ANALYSIS";

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD
  status: AsaasPaymentStatus;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeImage?: string;
  pixCopiaECola?: string;
  description?: string;
}

export interface CreateCustomerInput {
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
}

export interface CreatePaymentInput {
  customer: string; // Asaas customer ID
  billingType: AsaasBillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // nossa parcela ID
}

export interface AsaasPixData {
  encodedImage: string;
  payload: string; // copy-paste
  expirationDate: string;
}

async function asaasRequest<T>(
  env: AsaasEnvironment,
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URLS[env]}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Asaas API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function asaasCreateCustomer(
  env: AsaasEnvironment,
  apiKey: string,
  input: CreateCustomerInput,
): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(env, apiKey, "POST", "/customers", input);
}

export async function asaasCreatePayment(
  env: AsaasEnvironment,
  apiKey: string,
  input: CreatePaymentInput,
): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(env, apiKey, "POST", "/payments", input);
}

export async function asaasGetPixQrCode(
  env: AsaasEnvironment,
  apiKey: string,
  paymentId: string,
): Promise<AsaasPixData> {
  return asaasRequest<AsaasPixData>(env, apiKey, "GET", `/payments/${paymentId}/pixQrCode`);
}

export async function asaasGetPayment(
  env: AsaasEnvironment,
  apiKey: string,
  paymentId: string,
): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(env, apiKey, "GET", `/payments/${paymentId}`);
}

export async function asaasCancelPayment(
  env: AsaasEnvironment,
  apiKey: string,
  paymentId: string,
): Promise<void> {
  await asaasRequest(env, apiKey, "DELETE", `/payments/${paymentId}`);
}

/** Mapeia status Asaas → status interno. */
export function mapAsaasStatus(
  status: AsaasPaymentStatus,
): "pendente" | "pago" | "vencido" | "cancelado" {
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status)) return "pago";
  if (status === "OVERDUE") return "vencido";
  if (status === "CANCELED") return "cancelado";
  return "pendente";
}
