import { MessagesWsEvents } from "../constants/events.enum";
import { Message } from "./message.type";

export interface MessagesWsResponses {
  [MessagesWsEvents.NEW_MESSAGE]: {
    ip: string,
    message: string,
    date: Date
  },
  [MessagesWsEvents.CHAT_STATE]: {
    totalMessages?: number,
    totalUsers?: number,
    initialMessages?: Message[]
  }
} 
