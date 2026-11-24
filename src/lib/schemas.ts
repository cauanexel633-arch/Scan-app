import { z } from "zod";
export const clientSchema = z.object({
 nome:z.string().trim().max(160).optional().default(""),
 email:z.string().trim().email().max(254).or(z.literal("")).optional().default(""),
 senhaApp:z.string().max(256).optional().default(""),
 numeroSerie:z.string().trim().max(160).optional().default(""),
 equipamento:z.string().trim().max(160).optional().default(""),
 valorEquipamentos:z.union([z.string(),z.number()]).optional(),
 local:z.string().trim().max(240).optional().default(""),
 formaPagamento:z.string().trim().max(100).optional().default(""),
 status:z.string().trim().max(80).optional().default(""),
 desconto:z.union([z.string(),z.number()]).optional(),
 valorInstalacao:z.union([z.string(),z.number()]).optional()
}).strict();
export const requestSchema = z.object({
 requestId:z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/).optional(),
 client:clientSchema
}).strict();
export const scanSchema = z.object({
 requestId:z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/),
 barcode:z.string().trim().min(1).max(512)
}).strict();