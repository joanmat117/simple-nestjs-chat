import { createZodDto } from "nestjs-zod";
import z from "zod";

const NewMessageSchema = z.object({
  message: z.string().min(1)
})

export class NewMessageDto extends createZodDto(NewMessageSchema) { }
