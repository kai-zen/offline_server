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
import { printerDataType } from "src/helpers/types";

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
          { secret: process.env.JWT_SECRET }
        );
        const theAccess = await this.accessService.hasAccess(tokenData._id);
        if (theAccess) {
          socket.join(`orders-${complex_id}`);
        }
      }
    });
  }

  async addOrder(complex_id: string, orderData: OrderDocument) {
    this.server.to(`orders-${complex_id}`).emit("local-live-orders", {
      ...(orderData.toObject ? orderData.toObject() : orderData),
      is_update: false,
    });
  }

  async printReceipt(
    complex_id: string,
    data: { printer: printerDataType; receipt: any[] }
  ) {
    this.server.to(`orders-${complex_id}`).emit("print-receipt", data);
  }

  async changeOrder(data: {
    order: OrderDocument;
    complex_id: string;
    message?: string;
  }) {
    const { order, complex_id, message } = data;
    this.server.to(`order-${order._id.toString()}`).emit("order", {
      ...(order.toObject ? order.toObject() : order),
      is_update: true,
      message,
    });
    this.server.to(`orders-${complex_id}`).emit("local-live-orders", {
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
