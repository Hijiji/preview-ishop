import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyInstance, fastify } from 'fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const fastifyInstance: FastifyInstance = fastify();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ ignoreDuplicateSlashes: true, logger: true }),
    {
      cors: true,
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('ishopcare-preview-test')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(8081, '0.0.0.0', (err: Error, address: string) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`[${process.pid}] ✨ Application is listening on ${address}`);
  });
  console.log(`[${process.pid}] Invoked bootstrap`);
}
bootstrap();
