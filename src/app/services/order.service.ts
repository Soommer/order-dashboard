import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { tap } from 'rxjs';
import { Observable } from 'rxjs';

export interface CartItemInCartResponse {
  id: string;
  menuItemName: string;
  meatName: string;
  souceName: string;
  extraNames: string[];
  size: string;
  totalPrice: number;
}

export interface CartResponse {
  id: string;
  total: number;
  createdAt: string;
  isFinished: boolean;
  cartItems: CartItemInCartResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<CartResponse[]>([]);
  orders$ = this.ordersSubject.asObservable();
  private hubConnection?: signalR.HubConnection;

  constructor(private http: HttpClient) { }

  
  loadOrders() {
    return this.http.get<CartResponse[]>('https://localhost:7247/api/Cart/ReturnUnfinished').pipe(
      tap(orders => this.ordersSubject.next(orders))
    );
  }

  markOrderCompleted(id: string): Observable<void> {
    return this.http.put<void>(`https://localhost:7247/api/Cart?id=${id}`, {}).pipe(
      tap(() => {
        this.ordersSubject.next(this.ordersSubject.value.filter(o => o.id !== id));
      })
    );
  }


   connectToOrderHub() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7247/orderHub')
      .build();

    this.hubConnection.on('NewOrder', (order: CartResponse) => {
      console.log(order);
      this.ordersSubject.next([order, ...this.ordersSubject.value]);
    });

    this.hubConnection.on('OrderCompleted', (id: string) => {
      this.ordersSubject.next(this.ordersSubject.value.filter(o => o.id !== id));
    });

    this.hubConnection.start().catch(console.error);
  }
}
