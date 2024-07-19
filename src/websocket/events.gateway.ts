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
  constructor() {}

  @WebSocketServer()
  server: Server;

  async handleConnection() {
    this.server.on("connection", async (socket) => {
      socket.join("local-orders-channel");
    });
  }

  async addOrder(orderData: OrderDocument) {
    this.server.to("local-orders-channel").emit("local-live-orders", {
      ...(orderData?.toObject ? orderData.toObject() : orderData),
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
