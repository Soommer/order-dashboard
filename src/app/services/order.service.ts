import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { isPlatformBrowser } from '@angular/common';

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
  private isBrowser: boolean;

  private readonly apiUrl = 'https://sklep-api.wonderfulsand-657cf16a.polandcentral.azurecontainerapps.io';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  loadOrders() {
    return this.http.get<CartResponse[]>(`${this.apiUrl}/api/Cart/ReturnUnfinished`).pipe(
      tap(orders => this.ordersSubject.next(orders))
    );
  }

  markOrderCompleted(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/Cart?id=${id}`, {}).pipe(
      tap(() => {
        this.ordersSubject.next(this.ordersSubject.value.filter(o => o.id !== id));
      })
    );
  }

  connectToOrderHub() {
    if (!this.isBrowser) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.apiUrl}/orderHub`)
      .build();

    this.hubConnection.on('NewOrder', (order: CartResponse) => {
      this.ordersSubject.next([order, ...this.ordersSubject.value]);
    });

    this.hubConnection.on('OrderCompleted', (id: string) => {
      this.ordersSubject.next(this.ordersSubject.value.filter(o => o.id !== id));
    });

    this.hubConnection
      .start()
      .catch(err => console.error('Błąd połączenia z SignalR:', err));
  }
}
