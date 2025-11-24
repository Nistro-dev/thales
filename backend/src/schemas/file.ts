import { z } from "zod";

export const fileParamsSchema = z.object({
  id: z.string().uuid("Invalid file ID"),
});

export type FileParams = z.infer<typeof fileParamsSchema>;
