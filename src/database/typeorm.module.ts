import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Correspondence } from '@/ms-correspondence/correspondencia/correspondence.entity';
import { Destinatario } from '@/ms-correspondence/destinatarios/destinatario.entity';
import { DocumentType } from '@/ms-catalogo/tiposDocumento/documentType.entity';
import { Institution } from '@/ms-catalogo/institution/institution.entity';
import { PParticular } from '@/ms-catalogo/personParticular/pparticular.entity';
import { Derivation } from '@/ms-correspondence/derivaciones/derivation.entity';
import { AccessLog } from '@/ms-auth/accessLog/accessLog.entity';
import { Municipio } from '@/ms-catalogo/municipio/municipio.entity';
import { Official } from '@/ms-auth/funcionarios/official.entity';
import { GroupDocument } from '@/ms-files/document/document.entity';
import { Juridica } from '@/ms-catalogo/personaJuridica/juridica.entity';
import { Archived } from '@/ms-correspondence/archivados/archived.entity';
import { DocFile } from '@/ms-files/archivos/docFile.entity';
import { Entidad } from '@/ms-catalogo/entidad/entidad.entity';
import { Persona } from '@/ms-auth/personas/persona.entity';
import { Unidad } from '@/ms-catalogo/unidad/unidad.entity';
import { Sender } from '@/ms-correspondence/remitentes/sender.entity';
import { Inbox } from '@/ms-auth/inboxNotificaciones/inbox.entity';

import RepoService from './repo.service';
import { Cargo } from '@/ms-catalogo/cargo/cargo.entity';
import { Permission } from '@/ms-auth/permisos/permission.entity';
import { Role } from '@/ms-auth/roles/role.entity';
import { RolesFuncionario } from './rolesFuncionario.entity';
import { Task } from '@/ms-catalogo/tareas/task.entity';
import { TaskAsigned } from '@/ms-correspondence/tareasAsignadas/taskAsigned.entity';
import { HoliDays } from './holiDays.entity';
import { GrupoEnvio } from '@/ms-catalogo/gruposEnvio/grupo-envio.entity';
import { BorradorCompartido } from '@/ms-files/borradorCompartido/FuncionarioBorrador.entity';
import { FirmaDocument } from '@/ms-files/documentoFirmas/firma-document.entity';
import { CiteDocument } from '@/ms-files/documentoCites/cites-document.entity';
import { Oficina } from '@/ms-catalogo/oficina/oficina.entity';
import { ApplicationLogs } from '@/ms-logs/logs-application/logs-application.entity';
import { LogsApplicationModule } from '@/ms-logs/logs-application/logs-application.module';
import { GestionDocsDraft } from '@/ms-andromeda/gestion-draft/gestion-draft.entity';
import { DraftFile } from '@/ms-files/borrador/draft-file.entity';
import { Collaborator } from '@/ms-files/collaborators/collaborator.entity';
import { FileContent } from '@/ms-files/file-contens/file-conten.entity';
import { DocsAutoridad } from '@/ms-andromeda/docs-autoridad/docs-autoridad.entity';
import { GesAutoridad } from '@/ms-andromeda/ges-autoridad/ges-autoridad.entity';
import * as dotenv from 'dotenv';
import { FileObserved } from '@/ms-files/observed/observed.entity';

process.env.NODE_ENV === 'production' ? null : dotenv.config();

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC_TYPEORM === 'true' ? true : false,
      // autoLoadEntities: true,
      // logging: true,
      charset: 'utf8mb4',
      // logger: 'simple-console',
    }),
    TypeOrmModule.forFeature([
      BorradorCompartido,
      GestionDocsDraft,
      RolesFuncionario,
      ApplicationLogs,
      Correspondence,
      GroupDocument,
      FirmaDocument,
      DocsAutoridad,
      CiteDocument,
      GesAutoridad,
      DocumentType,
      Collaborator,
      Destinatario,
      FileObserved,
      TaskAsigned,
      Institution,
      PParticular,
      FileContent,
      Permission,
      GrupoEnvio,
      Derivation,
      Municipio,
      AccessLog,
      DraftFile,
      HoliDays,
      Official,
      Juridica,
      Archived,
      Entidad,
      Oficina,
      Persona,
      DocFile,
      Unidad,
      Sender,
      Inbox,
      Cargo,
      Role,
      Task,
    ]),
    LogsApplicationModule,
  ],
  controllers: [],
  providers: [RepoService],
  exports: [RepoService],
})
export class TypeormModule {}
