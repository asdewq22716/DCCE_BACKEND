import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import {
  AllExceptionsFilter,
  TransformInterceptor,
} from './common/global-response';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // เปิดใช้งาน CORS
  app.enableCors({
    origin: true, // อนุญาตทุก Origin หรือระบุ URL ของ Frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // อนุญาตให้ส่ง Cookie
  });

  app.use(cookieParser());

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('DCCE Backend API')
    .setDescription('The DCCE API description')
    .setVersion('1.0')
    .addServer('/api', 'Production via adaptme.dcce.go.th/api/')
    .addServer('https://dcce-dcce-backend.1gusxl.easypanel.host', 'Production Direct (EasyPanel)')
    .addServer('http://localhost:4721', 'Local Development')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);




  // 2. เปิดใช้งานเครื่องสแกนข้อมูลทั่วทั้งโปรเจ็ค
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ให้เตะฟิลด์ที่ไม่ได้ระบุไว้ใน DTO ทิ้งทันที (ความปลอดภัย)
      forbidNonWhitelisted: true, // ถ้าส่งฟิลด์แปลกปลอมมา ให้ Error กลับไปเลย
      transform: true, // ช่วยแปลง Type ให้โดยอัตโนมัติ
    }),
  );

  // 3. จัดการรูปแบบ Response และ Error ทั่วทั้งระบบ
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 4721, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);

  console.log('========== Environment Debug ==========');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DB_HOST: ${process.env.DB_HOST || '❌ NOT FOUND'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME || '❌ NOT FOUND'}`);
  console.log(`SSO_BASE_URL: ${process.env.SSO_BASE_URL || '❌ NOT FOUND'}`);
  console.log(
    `JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT FOUND'}`,
  );
  console.log('=======================================');
}
bootstrap();
