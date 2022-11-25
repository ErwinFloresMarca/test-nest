import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_rolesFuncionario', synchronize: false })
export class RolesFuncionario {
  @PrimaryColumn({ name: 'authFuncionariosId', nullable: false })
  authFuncionariosId: number;

  @PrimaryColumn({ name: 'authRolesId', nullable: false })
  authRolesId: number;
}
