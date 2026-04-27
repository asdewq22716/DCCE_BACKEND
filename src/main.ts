import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter, TransformInterceptor } from './common/global-response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('DCCE Backend API')
    .setDescription('The DCCE API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 2. เปิดใช้งานเครื่องสแกนข้อมูลทั่วทั้งโปรเจ็ค
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,               // ให้เตะฟิลด์ที่ไม่ได้ระบุไว้ใน DTO ทิ้งทันที (ความปลอดภัย)
    forbidNonWhitelisted: true,    // ถ้าส่งฟิลด์แปลกปลอมมา ให้ Error กลับไปเลย
    transform: true,               // ช่วยแปลง Type ให้โดยอัตโนมัติ
  }));

  // 3. จัดการรูปแบบ Response และ Error ทั่วทั้งระบบ
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
