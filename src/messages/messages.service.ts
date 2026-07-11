import { Injectable } from "@nestjs/common";
import { Message } from "./types/message.type";

@Injectable()
export class MessagesService {

  private messages: Message[] = []

  saveMessage(message: Message) {
    this.messages.push(message)
  }

  getAllMessages(): Message[] {
    return this.messages
  }

  getTotalMessages(): number {
    return this.messages.length
  }
}
