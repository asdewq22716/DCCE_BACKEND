import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'; // 1. Import ตัวช่วยเช็คมาเพิ่ม

export class CreateProductDto {
    @ApiProperty({ example: 'รองเท้าวิ่ง' })
    @IsString({ message: 'ชื่อสินค้าต้องเป็นจ้อความ' }) // 2. ต้องเป็น string
    @IsNotEmpty({ message: 'ชื่อสินค้าห้ามว่างนะ' })   // 3. ห้ามเป็นค่าว่าง
    name: string;

    @ApiProperty({ example: 1500 })
    @IsNumber({}, { message: 'ราคาต้องเป็นตัวเลข' })    // 4. ต้องเป็นตัวเลข
    @Min(0, { message: 'ราคาห้ามติดลบนะจ๊ะ' })         // 5. ห้ามมีค่าน้อยกว่า 0
    price: number;

    @ApiProperty({ example: 'รายละเอียด...', required: false })
    @IsOptional()                                   // 6. จะมีหรือไม่ก็ได้
    @IsString()
    description: string;
}
