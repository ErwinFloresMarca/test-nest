import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonModule } from './person/person.module';
import { BookModule } from './book/book.module';

@Module({
  imports: [PersonModule, BookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
