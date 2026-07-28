import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Order } from './models/order.model';
import { orderResolver } from './order.resolver';
import { OrderService } from './services/order.service';

const order: Order = {
  id: '1',
  quantity: 2,
  total: 19.98,
  customer: { id: '3', first_name: 'Jane', last_name: 'Doe' },
  product: { id: '5', product_name: 'Widget', unit_price: 9.99 },
};

function routeWithId(id: string): ActivatedRouteSnapshot {
  return { paramMap: { get: (key: string) => (key === 'id' ? id : null) } } as unknown as ActivatedRouteSnapshot;
}

describe('orderResolver', () => {
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj<OrderService>('OrderService', ['getById']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should resolve to the order returned by OrderService.getById(id) on success', (done) => {
    orderServiceSpy.getById.and.returnValue(of(order));

    const result = TestBed.runInInjectionContext(() =>
      orderResolver(routeWithId('1'), {} as never),
    ) as Observable<Order>;

    result.subscribe((resolved) => {
      expect(orderServiceSpy.getById).toHaveBeenCalledWith('1');
      expect(resolved).toEqual(order);
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('should navigate to /orders and complete with no emitted value when OrderService.getById errors', () => {
    orderServiceSpy.getById.and.returnValue(throwError(() => new Error('Order not found')));

    const result = TestBed.runInInjectionContext(() =>
      orderResolver(routeWithId('999'), {} as never),
    ) as Observable<Order>;

    const nextSpy = jasmine.createSpy('next');
    const completeSpy = jasmine.createSpy('complete');

    result.subscribe({ next: nextSpy, complete: completeSpy });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/orders');
    expect(nextSpy).not.toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
