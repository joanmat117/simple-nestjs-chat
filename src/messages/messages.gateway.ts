
import { Ack, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { } from "@nestjs/platform-socket.io"
import { Server, Socket } from "socket.io";
import { Logger, UseFilters, UsePipes } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { NewMessageDto } from "./dtos/new-message.dto";
import { WsExceptionFilter } from "./ws-exception.filter";
import { MessagesService } from "./messages.service";
import { MessagesWsEvents } from "./constants/events.enum";
import { MessagesWsResponses } from "./types/responses.type";


@WebSocketGateway({
  namespace: "chat"
})
@UsePipes(new ZodValidationPipe())
@UseFilters(new WsExceptionFilter())
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private logger: Logger = new Logger("MessagesGateway")

  constructor(
    private readonly messagesService: MessagesService
  ) { }

  @WebSocketServer()
  server: Server

  @SubscribeMessage(MessagesWsEvents.ADD_MESSAGE)
  handleNewMessage(

    @MessageBody() data: NewMessageDto,
    @ConnectedSocket() client: Socket,
    @Ack() ack?: (response: { isSuccess: boolean }) => void

  ) {

    this.logger.debug("Message recieved:", data)

    try {

      const date = new Date()

      this.messagesService.saveMessage({
        message: data.message,
        date,
        ip: client.handshake.address
      })

      const newMessage: MessagesWsResponses[MessagesWsEvents.NEW_MESSAGE] = {
        date,
        ip: client.handshake.address,
        message: data.message
      }

      this.server.emit(MessagesWsEvents.NEW_MESSAGE, newMessage)

      const chatState: MessagesWsResponses[MessagesWsEvents.CHAT_STATE] = {
        totalMessages: this.messagesService.getTotalMessages(),
      }

      this.server.emit(MessagesWsEvents.CHAT_STATE, chatState)

      ack?.({
        isSuccess: true
      })

    } catch (e) {
      ack?.({
        isSuccess: false
      })
    }
  }

  afterInit() {
    this.logger.log("Gateway initiated")
  }

  async handleConnection(client: Socket) {
    this.logger.log("User connected: ", client.handshake.address)

    const sockets = await this.server.fetchSockets()

    const chatState: MessagesWsResponses[MessagesWsEvents.CHAT_STATE] = {
      totalMessages: this.messagesService.getTotalMessages(),
      totalUsers: sockets.length,
      initialMessages: this.messagesService.getAllMessages()
    }

    client.emit(MessagesWsEvents.CHAT_STATE, chatState)

    const newUsersState: MessagesWsResponses[MessagesWsEvents.CHAT_STATE] = {
      totalUsers: sockets.length
    }

    client.broadcast.emit(MessagesWsEvents.CHAT_STATE, newUsersState)
  }

  async handleDisconnect(client: Socket) {
    this.logger.log("User disconnected: ", client.handshake.address)

    const sockets = await this.server.fetchSockets()

    const newUsersState: MessagesWsResponses[MessagesWsEvents.CHAT_STATE] = {
      totalUsers: sockets.length
    }

    client.broadcast.emit(MessagesWsEvents.CHAT_STATE, newUsersState)

  }

}
