import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  findAll() {
     // จำลองข้อมูลสินค้า (Mock Data)
  return [
    { id: 1, name: 'รองเท้าวิ่ง', price: 1500, description: 'ใส่สบาย ทนทาน' },
    { id: 2, name: 'กระเป๋าเป้', price: 850, description: 'จุของได้เยอะ' },
  ]
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
