import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_rolesPermisos', synchronize: false })
export class RolesPermisos {
  @PrimaryColumn({ name: 'authPermissionsId' })
  authPermissionsId: number;

  @PrimaryColumn({ name: 'authRolesId' })
  authRolesId: number;
}
