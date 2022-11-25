import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Book } from 'src/book/book.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'personas' })
export class Persona {
  @ApiProperty()
  @PrimaryGeneratedColumn({ unsigned: true, comment: 'primary key' })
  id: number;

  @ApiProperty()
  @Column({ unique: true, length: 25, nullable: false })
  @IsDefined()
  @IsNotEmpty()
  numeroDocumento: string;

  @ApiProperty()
  // @Column({ nullable: true })
  // @Column({ nullable: true, length: 2, name: 'complemento' })
  // complemento: string;
  @ApiProperty()
  @Column({ nullable: false })
  @IsString()
  @IsDefined()
  @Transform((field) =>
    field.value ? field.value.trim().toUpperCase() : field.value,
  )
  nombres: string;

  @Column({ unique: true, nullable: true })
  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty()
  @OneToMany(() => Book, (book) => book.person)
  books: Book;
}
