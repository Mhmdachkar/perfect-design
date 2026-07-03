import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(1).max(8),
  method: z.string().trim().min(1).max(40),
  client_id: z.string().uuid("Client is required"),
  workshop_id: z.string().uuid().optional().or(z.literal("")),
  received_date: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(1).max(8),
  category: z.string().trim().min(1).max(60),
  expense_date: z.string().min(1, "Date is required"),
  vendor: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const workshopSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  client_id: z.string().uuid("Client is required"),
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(1).max(8),
  deadline: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
});

export const settingsBusinessSchema = z.object({
  business_name: z.string().trim().max(200).optional().or(z.literal("")),
  base_currency: z.string().trim().min(1).max(8),
  default_tax_rate: z.coerce.number().min(0).max(100),
});

export const exchangeRateSchema = z.object({
  currency: z.string().trim().min(1).max(8),
  rate: z.coerce.number().positive("Rate must be positive"),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed";
}
