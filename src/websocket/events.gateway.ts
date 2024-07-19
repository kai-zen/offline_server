import { AccessService } from "src/features/user/access/access.service";
import { JwtService } from "@nestjs/jwt";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { OrderDocument } from "src/features/order/order.schema";

@WebSocketGateway({ cors: { origin: "*" } })
export class EventsGateway {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accessService: AccessService
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection() {
    this.server.on("connection", async (socket) => {
      const { localToken, complex_id } = socket.handshake.query;
      if (complex_id && localToken) {
        const tokenData = await this.jwtService.verifyAsync(
          localToken as string,
          { secret: "POKp6aK2DpGViU2wVvHYb3q00tDn5b" }
        );
        const theAccess = await this.accessService.hasAccess(tokenData._id);
        if (theAccess) socket.join("local-orders-channel");
      }
    });
  }

  async addOrder(orderData: OrderDocument) {
    this.server.to("local-orders-channel").emit("local-live-orders", {
      ...orderData,
      is_update: false,
    });
  }

  async printReceipt(data: { printer: any; receipt: any[] }) {
    this.server.to("local-orders-channel").emit("print-receipt", data);
  }

  async changeOrder(data: { order: OrderDocument; message?: string }) {
    const { order, message } = data;
    this.server.to("local-orders-channel").emit("local-live-orders", {
      ...(order.toObject ? order.toObject() : order),
      is_update: true,
      message,
    });
  }

  @SubscribeMessage("local-live-orders")
  findAll(@MessageBody() body: OrderDocument) {
    return body;
  }

  @SubscribeMessage("order")
  orderStatus(@MessageBody() body: OrderDocument) {
    return body;
  }
}
