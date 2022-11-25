import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cat_tareas_unidad', synchronize: false })
export class TareasUnidad {
  @PrimaryColumn({ name: 'catTareasId' })
  catTareasId: number;

  @PrimaryColumn({ name: 'catUnidadesId' })
  catUnidadesId: number;
}
