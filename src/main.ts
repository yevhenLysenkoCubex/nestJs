// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

const port = process.env.PORT || 4000;

async function bootstrap() {
   const app = await NestFactory.create(AppModule);
   app.useGlobalPipes(
      new ValidationPipe({
         whitelist: true,
      }),
   );
   await app.listen(port);

   if (module.hot) {
      module.hot.accept();
      module.hot.dispose(() => app.close());
   }
}

bootstrap();
