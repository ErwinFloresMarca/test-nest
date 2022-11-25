import { smsNotEmpty } from '@/utils/validator.sms';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cat_fechasFeriados' })
@ObjectType()
export class HoliDays {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Field({ nullable: false })
  @Column({ type: 'date', name: 'fecha', comment: 'field for save date holidays' })
  date: Date;

  @Field({ nullable: true, description: 'Descripción de fecha feriado' })
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: smsNotEmpty('Descripción de fecha feriado') })
  @Transform((field) => (field.value ? field.value.trim().toUpperCase() : field.value))
  @Column({ type: 'text', name: 'descripcion', nullable: true })
  description: string;

  @Field({ nullable: true })
  @CreateDateColumn({ type: 'timestamp', comment: 'field for save datetime when created a row' })
  createdAt: Date;
}
