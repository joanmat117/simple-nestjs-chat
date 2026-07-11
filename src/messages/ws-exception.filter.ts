import { Catch, ArgumentsHost, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Catch(WsException, Error)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private logger = new Logger("WsExceptionFilter");

  catch(exception: WsException | Error, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();
    
    // Extraer el patrón del mensaje (evento)
    const pattern = (host.switchToWs().getClient() as any)?.ev?.toString() || "unknown";

    this.logger.error(`Validation error: ${exception.message}`, exception.stack);

    const errorResponse = {
      status: "error",
      message: exception.message || "Validation failed",
      cause: {
        pattern,
        data,
      },
    };

    // Enviar el error al cliente
    client.emit("exception", errorResponse);
  }
}
