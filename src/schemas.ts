import { z } from "zod";
import { isAddress } from "viem";

export const publishJobSchema = z.object({
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  budget: z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, "Budget inválido."),
  evaluator: z.string().refine((v) => Boolean(isAddress(v)), "La address del evaluador no es válida."),
  provider: z
    .string()
    .trim()
    .refine((v) => v === "" || Boolean(isAddress(v)), "La address del proveedor no es válida."),
  expiresAt: z
    .string()
    .min(1, "Elegí una fecha de expiración.")
    .refine((v) => new Date(v).getTime() > Date.now(), "La fecha tiene que ser futura."),
});

export type PublishJobValues = z.infer<typeof publishJobSchema>;
