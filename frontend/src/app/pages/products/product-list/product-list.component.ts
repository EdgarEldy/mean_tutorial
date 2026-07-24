import { Component } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  // Initialize products array
  products?: Product[];

  // Initialize product object
  product: Product = {
    id: 0,
    category_id: 0,
    product_name: '',
    unit_price: 0,
    Category: {
      id: 0,
      category_name: ''
    }
  };

  // Constructor
  constructor(
    private readonly productService: ProductService,
    private readonly modalService: NgbModal,
    private readonly toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.loadProducts();
  }

  // Load products
  loadProducts() {
    this.productService.getAll().subscribe({
      next: (data: Product[]): void => {
        console.log(data);
        this.products = data;
      },
      error: (err): void => {
        console.log(err);
      }
    })
  }
}
