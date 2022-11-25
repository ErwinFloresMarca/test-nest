import { ApiProperty } from '@nestjs/swagger';
import { Persona } from 'src/person/person.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'libros' })
export class Book {
  @ApiProperty()
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  // relations

  @ApiProperty()
  @Column({ unsigned: true, nullable: true })
  personaId: number;
  @ManyToOne(() => Persona, (person) => person.books, {
    persistence: true,
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'personaId', referencedColumnName: 'id' })
  @ApiProperty()
  person: Persona;
}
