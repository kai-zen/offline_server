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
      if (localToken) {
        if (complex_id) {
          const tokenData = await this.jwtService.verifyAsync(
            localToken as string,
            {
              secret: "BQR0yzn6vMN1auL7gTimEf",
            }
          );
          const theAccess = await this.accessService.hasAccess(
            tokenData._id,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          );
          if (theAccess) {
            socket.join(`orders-${complex_id}`);
            if ([1, 2, 5, 6].includes(theAccess.type))
              socket.join(`waiter-${complex_id}`);
          }
        }
      }
    });
  }

  async addOrder(complex_id: string, orderData: OrderDocument) {
    this.server
      .to(`orders-${complex_id}`)
      .emit("live-orders", { ...orderData.toObject(), is_update: false });
  }

  async callWaiter(
    complex_id: string,
    data: {
      table_number: number | string;
      _id: string;
      description?: string;
      is_deleted?: boolean;
    }
  ) {
    this.server.to(`waiter-${complex_id}`).emit("call-waiter", data);
  }

  async changeOrder(data: { order: OrderDocument; complex_id: string }) {
    const { order, complex_id } = data;
    this.server
      .to(`order-${order._id.toString()}`)
      .emit("order", { ...order.toObject(), is_update: true });
    this.server
      .to(`orders-${complex_id}`)
      .emit("live-orders", { ...order.toObject(), is_update: true });
  }

  @SubscribeMessage("live-orders")
  findAll(@MessageBody() body: OrderDocument) {
    return body;
  }

  @SubscribeMessage("call-waiter")
  callWaiterMessage(
    @MessageBody()
    body: {
      table_number: number | string;
      _id: string;
      description?: string;
      is_deleted?: boolean;
    }
  ) {
    return body;
  }

  @SubscribeMessage("order")
  orderStatus(@MessageBody() body: OrderDocument) {
    return body;
  }
}
