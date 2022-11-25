import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { bold } from 'chalk';

import { AppModule } from './app.module';
import { APP_VERSION } from './global.variables';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.enableCors();

  app.use(express.json({ limit: process.env.APP_FILE_MAX_SIZE }));
  app.use(
    express.urlencoded({
      limit: process.env.APP_FILE_MAX_SIZE,
      extended: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('JUSTICIA LIBRE API')
      .setDescription(
        'Basado en principios REST, las API devuelve metadatos JSON.',
      )
      .setVersion(APP_VERSION)
      .setContact(
        'Unidad de Tecnologías de la Información y Comunicación - Ministerio Público',
        '',
        'informatica@fiscalia.gob.bo',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document, {
      customSiteTitle: 'JUSTICIA LIBRE API',
      customfavIcon: '../assets/images/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }
  // app.useGlobalFilters(new HttpExceptionFilter(), new BadRequestExceptionFilter());

  await app.listen(process.env.PORT || 8108, '0.0.0.0').then(async () => {
    console.log(
      bold.blue('API REST is listening ON ', (await app.getUrl()) + '/api'),
    );
  });
}

bootstrap();
