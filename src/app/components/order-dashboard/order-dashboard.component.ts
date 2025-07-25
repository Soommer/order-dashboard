import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Observable, catchError, of } from 'rxjs';
import { CartResponse } from '../../services/order.service';
import { NgFor, NgIf } from '@angular/common';
import { OrderCardComponent } from '../order-card/order-card.component';
import { CommonModule } from '@angular/common';
import { Pipe } from '@angular/core';

@Component({
  selector: 'app-order-dashboard',
  imports: [NgIf, NgFor, OrderCardComponent, CommonModule],
  standalone: true,
  templateUrl: './order-dashboard.component.html',
  styleUrls: ['./order-dashboard.component.scss']
})
export class OrderDashboardComponent implements OnInit {
  orders$: Observable<CartResponse[]>;
  errorMessage: string | null = null;
  loading: boolean = false;

  constructor(private orderService: OrderService) {
    this.orders$ = this.orderService.orders$;
  }

  ngOnInit() {
    this.loadOrders();
    this.orderService.connectToOrderHub();
  }

  loadOrders() {
    console.log("load orders start.....")
  this.loading = true;
  this.errorMessage = null;

    this.orderService.loadOrders().subscribe({
      next: () => {
        this.loading = false;
        console.log(".....loading finished")
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Błąd podczas ładowania zamówień.';
        console.error(error);
      }
    });
  }

  onOrderCompleted(orderId: string) {
    this.orderService.markOrderCompleted(orderId).subscribe({
      next: () => {
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = 'Błąd przy oznaczaniu zamówienia jako zrealizowanego.';
        console.error(error);
      }
    });
  }
}

