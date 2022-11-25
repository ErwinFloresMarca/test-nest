import { PersonModule } from './../person/person.module';
import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  imports: [PersonModule],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
