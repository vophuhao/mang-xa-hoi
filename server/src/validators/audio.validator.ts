import { z } from "zod";
import { mongoIdSchema } from "./common.validator";



export const getAudioByIdSchema = z.object({
  id: mongoIdSchema,
});
