import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ProductsService {

  constructor(private readonly authService: AuthService) { }

  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAll(token: string) {
    // 1. ตรวจสอบสิทธิ์ผ่าน AuthService (ที่เรา Import มาจาก AuthModule)
    const userData = await this.authService.verify(token);

    if (!userData) {
      // ถ้า Token ไม่ถูกต้อง (จริงๆ ใน AuthService เรา throw ไว้แล้ว แต่ดักไว้อีกชั้นเพื่อความชัวร์)
      return { message: 'กรุณาเข้าสู่ระบบก่อนดูรายการสินค้า' };
    }

    // 2. ถ้าผ่าน ให้แสดงข้อมูลสินค้า (Mock Data)
    return [
      { id: 1, name: 'รองเท้าวิ่ง', price: 1500, description: 'ใส่สบาย ทนทาน', owner: userData.sso_username },
      { id: 2, name: 'กระเป๋าเป้', price: 850, description: 'จุของได้เยอะ', owner: userData.sso_username },
    ];
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
