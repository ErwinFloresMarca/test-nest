// src/repo.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as uniqid from 'uniqid';

import { Correspondence } from '@/ms-correspondence/correspondencia/correspondence.entity';
import { PParticular } from '@/ms-catalogo/personParticular/pparticular.entity';
import { Institution } from '@/ms-catalogo/institution/institution.entity';
import { Juridica } from '@/ms-catalogo/personaJuridica/juridica.entity';
import { Municipio } from '@/ms-catalogo/municipio/municipio.entity';
import { Entidad } from '@/ms-catalogo/entidad/entidad.entity';
import { Unidad } from '@/ms-catalogo/unidad/unidad.entity';
import { AccessLog } from '@/ms-auth/accessLog/accessLog.entity';
import { Sender } from '@/ms-correspondence/remitentes/sender.entity';
import { Official } from '@/ms-auth/funcionarios/official.entity';
import { GroupDocument } from '@/ms-files/document/document.entity';
import { DocFile } from '@/ms-files/archivos/docFile.entity';
import { Persona } from '@/ms-auth/personas/persona.entity';
import { Archived } from '@/ms-correspondence/archivados/archived.entity';
import { Destinatario } from '@/ms-correspondence/destinatarios/destinatario.entity';
import { Derivation } from '@/ms-correspondence/derivaciones/derivation.entity';
import { Inbox } from '@/ms-auth/inboxNotificaciones/inbox.entity';
import { Cargo } from '@/ms-catalogo/cargo/cargo.entity';
import { RolesFuncionario } from './rolesFuncionario.entity';
import { Role } from '@/ms-auth/roles/role.entity';
import { Permission } from '@/ms-auth/permisos/permission.entity';
import { CreateInboxInput } from '@/ms-auth/inboxNotificaciones/dto/inbox.input';
import { Task } from '@/ms-catalogo/tareas/task.entity';
import { TaskAsigned } from '@/ms-correspondence/tareasAsignadas/taskAsigned.entity';
import { HoliDays } from './holiDays.entity';
import { DocumentType } from '@/ms-catalogo/tiposDocumento/documentType.entity';
import { UltimoCite } from '@/ms-correspondence/correspondencia/dto/correspondence.args';
import { msPdfRender } from '@/utils/ms-pdf-render/ms-pdf-render.helpers';
import { sendWhatsappHelperV1 } from '@/utils/whatsapp.helper';
import {
  dateTimeNow,
  formatDate,
  diaFechaLiteralMayuscula,
  diaFechaLiteralMinuscula,
  diaSemanaLiteralMinuscula,
  diaSemanaLiteralMayuscula,
  fechaDMY,
  fechaHoraDMY,
  fechaHoraYMD,
  fechaLiteralMayuscula,
  fechaLiteralMinuscula,
  fechaYMD,
  HoraM,
  HoraMS,
  mesLiteralMayuscula,
  mesLiteralMinuscula,
  diaFechaLiteralHoraMayuscula,
  diaFechaLiteralHoraMinuscula,
  fechaLiteralCompletaMayuscula,
  fechaLiteralCompletaMinuscula,
} from '@/utils/dateFormat';
import { FuncionariosPayload, UserDataPayload, UserPayload } from '@/auth/constants';
import axios from 'axios';
import {
  encodeFileToBase64V3,
  fileToBase64V1,
  getFileSha256,
  getTemporalToPath,
  moveFileTemporalToPath,
  verifyExistsFile,
} from '@/utils/file.helper';
import { msFilesRead, msWriteFile } from '@/utils/msfiles.helper';
import { IResponse, ResponseMsg } from '@/utils/IResponse';
import { GrupoEnvio } from '@/ms-catalogo/gruposEnvio/grupo-envio.entity';
import { BorradorCompartido } from '@/ms-files/borradorCompartido/FuncionarioBorrador.entity';
import { CiteDocument } from '@/ms-files/documentoCites/cites-document.entity';
import { FirmaDocument } from '@/ms-files/documentoFirmas/firma-document.entity';
import { Oficina } from '@/ms-catalogo/oficina/oficina.entity';
import { GrupoMasivo } from '@/ms-correspondence/correspondencia/dto/correspondence.input';
import { LastCiteInput } from '@/ms-files/documentoCites/dto/cites-document.input';
import { DtoPdfRender, FilesInput, MainFileInput } from '@/ms-files/archivos/dto/docFile.input';
import { FuncionariosDestinoInput } from '@/ms-correspondence/derivaciones/dto/derivation.input';
import { LogsApplicationService } from '@/ms-logs/logs-application/logs-application.service';
import { CreateLogsInput } from '@/ms-logs/logs-application/dto/logs-application.input';
import { ApplicationLogs } from '@/ms-logs/logs-application/logs-application.entity';
import { DraftFile } from '@/ms-files/borrador/draft-file.entity';
import { Collaborator } from '@/ms-files/collaborators/collaborator.entity';
import { FileContent } from '@/ms-files/file-contens/file-conten.entity';
import { GestionDocsDraft } from '@/ms-andromeda/gestion-draft/gestion-draft.entity';
import { GesAutoridad } from '@/ms-andromeda/ges-autoridad/ges-autoridad.entity';
import { DocsAutoridad } from '@/ms-andromeda/docs-autoridad/docs-autoridad.entity';
import { FileObserved } from '@/ms-files/observed/observed.entity';

@Injectable()
class RepoService {
  public constructor(
    public readonly logsService: LogsApplicationService,

    @InjectRepository(Correspondence)
    public readonly correspRepository: Repository<Correspondence>,
    @InjectRepository(Destinatario)
    public readonly destinatarioRepository: Repository<Destinatario>,
    @InjectRepository(DocumentType)
    public readonly docTypeRepository: Repository<DocumentType>,
    @InjectRepository(RolesFuncionario)
    public readonly rolesUserRepository: Repository<RolesFuncionario>,
    @InjectRepository(BorradorCompartido)
    public readonly draftSharedRepository: Repository<BorradorCompartido>,
    @InjectRepository(FirmaDocument)
    public readonly firmasRepository: Repository<FirmaDocument>,
    @InjectRepository(CiteDocument)
    public readonly citesRepository: Repository<CiteDocument>,
    @InjectRepository(ApplicationLogs)
    public readonly logsRepository: Repository<ApplicationLogs>,
    @InjectRepository(GestionDocsDraft)
    public readonly gestionDocsDraft: Repository<GestionDocsDraft>,
    @InjectRepository(GesAutoridad)
    public readonly gesAutoridadRepository: Repository<GesAutoridad>,
    @InjectRepository(DocsAutoridad)
    public readonly docsAutoridadRepository: Repository<DocsAutoridad>,
    @InjectRepository(GroupDocument)
    public readonly documentRepository: Repository<GroupDocument>,
    @InjectRepository(Collaborator)
    public readonly collaboratorRepository: Repository<Collaborator>,
    @InjectRepository(FileObserved)
    public readonly FileObservedRepository: Repository<FileObserved>,

    @InjectRepository(FileContent) public readonly fileContentRepository: Repository<FileContent>,
    @InjectRepository(TaskAsigned) public readonly taskAsignedRepository: Repository<TaskAsigned>,
    @InjectRepository(PParticular) public readonly particularRepository: Repository<PParticular>,
    @InjectRepository(Institution) public readonly institutionRepository: Repository<Institution>,
    @InjectRepository(Permission) public readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Derivation) public readonly derivationRepository: Repository<Derivation>,
    @InjectRepository(GrupoEnvio) public readonly gruposEnvioRepository: Repository<GrupoEnvio>,
    @InjectRepository(Municipio) public readonly municipioRepository: Repository<Municipio>,
    @InjectRepository(DraftFile) public readonly draftFileRepository: Repository<DraftFile>,
    @InjectRepository(AccessLog) public readonly accessLogRepository: Repository<AccessLog>,
    @InjectRepository(Official) public readonly officialRepository: Repository<Official>,
    @InjectRepository(Juridica) public readonly juridicaRepository: Repository<Juridica>,
    @InjectRepository(HoliDays) public readonly holiDaysRepository: Repository<HoliDays>,
    @InjectRepository(Archived) public readonly archivedRepository: Repository<Archived>,
    @InjectRepository(Entidad) public readonly entidadRepository: Repository<Entidad>,
    @InjectRepository(Oficina) public readonly oficinaRepository: Repository<Oficina>,
    @InjectRepository(DocFile) public readonly docFileRepository: Repository<DocFile>,
    @InjectRepository(Persona) public readonly personaRepository: Repository<Persona>,
    @InjectRepository(Unidad) public readonly unidadRepository: Repository<Unidad>,
    @InjectRepository(Sender) public readonly senderRepository: Repository<Sender>,
    @InjectRepository(Inbox) public readonly inboxRepository: Repository<Inbox>,
    @InjectRepository(Cargo) public readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Role) public readonly roleRepository: Repository<Role>,
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
  ) {}

  async verifyIsSuperUser(funcionarioId: number): Promise<boolean> {
    const permissions: Permission[] = await this.permissionRepository.find();

    const TextRow = await this.permissionRepository.query(
      `SELECT COUNT(DISTINCT accion) as permissionsCount FROM auth_permissions ap
      left join auth_rolesPermisos rp on ap.id = rp.authPermissionsId
      left join auth_rolesFuncionario ar on ar.authRolesId = rp.authRolesId WHERE ar.authFuncionariosId = ?;`,
      [funcionarioId],
    );
    const permissionsCount = Number(TextRow[0].permissionsCount);
    return permissions.length === permissionsCount ? true : false;
  }

  /**
   * servicio que devuelve tods los datos de usuario, incluido los permisos q tiene
   * @param user user logueado al sistema
   * @returns
   */
  async getCurrentUserData(user: UserPayload, withPermissions = true): Promise<UserDataPayload> {
    const { numeroDocumento, funcionarioId, personaId, isSuperUser } = user;

    // query para obtener datos del usuario logueado
    const TextRow: any[] = await this.officialRepository.query(
      `SELECT inst.id institucionId ,inst.nombre as institucion,
       ent.id as entidadId, ent.nombre as entidad,
       ofi.id as oficinaId, ofi.nombre as oficina,
       unid.id as unidadId, unid.nombre as unidad,
       p.nombresApellidos, c.nombre as cargo, c.id as cargoId,
       p.gradoAbrev, p.gradoAcademico, p.profesionOcupacion,
       p.firmaFisicaId, f.esJefe as isManager
      FROM auth_funcionarios f
        INNER JOIN auth_personas p ON p.id = ${personaId}
        INNER JOIN cat_unidades unid on unid.id = f.unidadId
        INNER JOIN cat_entidades ent on ent.id = f.entidadId
        INNER JOIN cat_instituciones inst on inst.id = f.institutionId
        INNER JOIN cat_oficinas ofi on ofi.id = f.oficinaId
        INNER JOIN cat_cargos c on c.id = f.cargoId
        WHERE f.id = ?;`,
      [funcionarioId],
    );

    // query para obtener los permisos del usuario
    let permissions: string[] = [];
    if (withPermissions) {
      permissions = await this.permissionRepository
        .query(
          ` SELECT p.accion FROM auth_rolesFuncionario aru
        INNER JOIN auth_rolesPermisos arp ON arp.authRolesId = aru.authRolesId
        INNER JOIN auth_permissions p ON p.id = arp.authPermissionsId 
        WHERE aru.authFuncionariosId = ? GROUP BY p.accion;`,
          [funcionarioId],
        )
        .then((result) => result.map((i) => i.accion));
    }

    const userData: UserDataPayload = {
      ...TextRow[0],
      numeroDocumento,
      funcionarioId,
      personaId,
      isSuperUser,
      permissions,
    };
    return userData;
  }

  /**
   * servicio que devuelve tods los datos de usuario, incluido los permisos q tiene
   * @param user user logueado al sistema
   * @returns
   */
  async getUserDataById(funcionarioId: number, withPermissions = true): Promise<UserDataPayload> {
    // query para obtener datos del usuario logueado
    const TextRow: any[] = await this.officialRepository.query(
      `SELECT inst.id institucionId ,inst.nombre as institucion,
         ent.id as entidadId, ent.nombre as entidad,
         ofi.id as oficinaId, ofi.nombre as oficina,
         unid.id as unidadId, unid.nombre as unidad,
         f.numeroDocumento, f.personaId as personaId,
         p.nombresApellidos, c.nombre as cargo, c.id as cargoId,
         p.gradoAbrev, p.gradoAcademico, p.profesionOcupacion,
         p.firmaFisicaId, f.esJefe as isManager
        FROM auth_funcionarios f
          INNER JOIN auth_personas p ON p.id = f.personaId
          INNER JOIN cat_unidades unid on unid.id = f.unidadId
          INNER JOIN cat_entidades ent on ent.id = f.entidadId
          INNER JOIN cat_instituciones inst on inst.id = f.institutionId
          INNER JOIN cat_oficinas ofi on ofi.id = f.oficinaId
          INNER JOIN cat_cargos c on c.id = f.cargoId
          WHERE f.id = ?;`,
      [funcionarioId],
    );

    // query para obtener los permisos del usuario
    let permissions: string[] = [];
    if (withPermissions) {
      permissions = await this.permissionRepository
        .query(
          ` SELECT p.accion FROM auth_rolesFuncionario aru
          INNER JOIN auth_rolesPermisos arp ON arp.authRolesId = aru.authRolesId
          INNER JOIN auth_permissions p ON p.id = arp.authPermissionsId 
          WHERE aru.authFuncionariosId = ? GROUP BY p.accion;`,
          [funcionarioId],
        )
        .then((result) => result.map((i) => i.accion));
    }

    const userData: UserDataPayload = {
      ...TextRow[0],
      funcionarioId,
      isSuperUser: false,
      permissions,
    };
    return userData;
  }

  /**
   * servicio que devuelve lista de funcionarios con datos y relaciones
   * @param user user logueado al sistema
   * @returns
   */
  async getFuncionariosData(
    user: UserDataPayload,
    funcionariosIds: number[],
  ): Promise<FuncionariosPayload[]> {
    funcionariosIds = [...new Set(funcionariosIds.map((el) => Number(el)))];
    if (funcionariosIds.length) {
      // query para obtener datos de los funcionarios
      const TextRow: any[] = await this.officialRepository.query(
        `SELECT inst.id institucionId ,inst.nombre as institucion,
           ent.id as entidadId, ent.nombre as entidad,
           ofi.id as oficinaId, ofi.nombre as oficina,
           unid.id as unidadId, unid.nombre as unidad,
           f.id as funcionarioId, p.id as personaId, p.numeroDocumento as numeroDocumento,         
           p.nombresApellidos, c.nombre as cargo, c.id as cargoId,
           p.gradoAbrev, p.gradoAcademico, p.profesionOcupacion,
           p.firmaFisicaId, f.esJefe as isManager
          FROM auth_funcionarios f
            INNER JOIN auth_personas p ON p.id = f.personaId
            INNER JOIN cat_unidades unid on unid.id = f.unidadId
            INNER JOIN cat_entidades ent on ent.id = f.entidadId
            INNER JOIN cat_instituciones inst on inst.id = f.institutionId
            INNER JOIN cat_oficinas ofi on ofi.id = f.oficinaId
            INNER JOIN cat_cargos c on c.id = f.cargoId
            WHERE f.id IN (?);`,
        [funcionariosIds],
      );
      return [...TextRow];
    } else {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { permissions, isSuperUser, ...restante } = user;
        return [restante];
      }
      return [];
    }
  }

  uniqFileCodeGenerator(documentTypeId: number, correspondenceId: number): string {
    const currentTimeInSeconds = Date.now().toString(); //unix timestamp in seconds
    const codigoDocumento = documentTypeId ? `${documentTypeId}-` : '';
    const codigoCorrespondencia = documentTypeId ? `${correspondenceId}-` : '';

    return `${codigoDocumento}${codigoCorrespondencia}${currentTimeInSeconds.slice(
      -5,
    )}${uniqid.time()}`;
  }

  /**
   * service for send create a notificacion in db
   * then send whatsapp sms and web push notificacion
   * @param data
   */
  async createDataInbox(data: CreateInboxInput) {
    const { message, fromUserId, toUserId, rowId, entityName, correspondenciaId, isMassive } = data;

    const inboxTemp = this.inboxRepository.create({
      fromUserId,
      toUserId,
      message,
      rowId,
      entityName,
    });
    await this.inboxRepository.save(inboxTemp).then((inbox) => {
      this.officialRepository
        .findOne(toUserId, { relations: ['person'] })
        .then(async (toUser) => {
          const saludo =
            inbox.updatedAt.getHours() >= 19
              ? '🌌 Buenas noches'
              : inbox.updatedAt.getHours() >= 12
              ? '🏞️ Buenas tardes'
              : '🌅 Buenos días';
          const receptor = saludo + ` _${toUser.person.nombres}_`;
          const sms = `📥 tienes una ${message.toLocaleLowerCase()}\n`;

          const url = process.env.WEB_PUSH_SERVICE_API + '/send';
          const origin = process.env.VUE_APP_FRONT_URL;
          const sendWhatsapp = process.env.SEND_WHATSAPP_SMS;
          const enableSendWebPush = process.env.SEND_WEB_PUSH_SMS;

          // seccion de notificacion por whastapp
          // si la cantidad supera los 100 destinatarios, entonces solo se enviara notificaion solo a jefes
          let sendNotify = true;
          if (isMassive) sendNotify = toUser.isManager ? true : false;

          if (toUser.person.haveWhatsApp && sendWhatsapp === 'true' && sendNotify) {
            const fromUser = await this.officialRepository.findOne(fromUserId, {
              relations: ['person'],
            });

            const emisor = `de : _${fromUser.person.nameCompleteForName}_ 👤\n`;
            const fecha = `en fecha ${formatDate(inbox.updatedAt.toISOString())} 🗓️\n`;
            let link = `🔗${origin}`;
            if (correspondenciaId) link = `${link}/#/correspondencia/${correspondenciaId}`;

            const app_name = `         ᴹᴵᴺᴵˢᵀᴱᴿᴵᴼ ᴾᵁᴮᴸᴵᶜᴼ`;
            const text = `*GESTIÓN DOCUMENTAL V1 📧*\n\n${receptor}\n${sms}\n${emisor}${fecha}\n${link}\n${app_name}`;
            try {
              sendWhatsappHelperV1('591' + toUser.person.phone, text);
            } catch (error) {}
          }

          // can send web push notification
          if (enableSendWebPush === 'true') {
            try {
              await axios.post(url, {
                dataWhere: { numeroDocumento: toUser.numeroDocumento, origin },
                payload: {
                  title: receptor,
                  body: sms,
                  icon: 'https://cloud.fiscalia.gob.bo/index.php/s/W9KtJfiBNKD6Fbz/preview',
                  redirect: 'https://correspondencia.fiscalia.gob.bo/#/',
                },
              });
            } catch (error) {}
          }
        })
        .catch();
    });
  }
  async getLastCitesArray(
    funcionariosData: FuncionariosPayload[],
    documentType: DocumentType,
  ): Promise<UltimoCite[]> {
    const citesItems = await Promise.all(
      funcionariosData.map(async ({ entidadId, unidadId, funcionarioId, oficinaId }) => {
        return await this.getUltimoCiteDocument({
          entidadId,
          unidadId,
          documentType,
          funcionarioId,
          oficinaId,
        });
        // return { ...data, oficinaId, funcionarioId };
      }),
    );
    return citesItems;
  }

  async getUltimoCiteDocument(input: LastCiteInput): Promise<UltimoCite> {
    const { entidadId, unidadId, documentType, funcionarioId, oficinaId } = input;

    const gestion = new Date().getFullYear();

    const queryBuilder = this.citesRepository
      .createQueryBuilder('c')
      .where({ gestion, entidadId, unidadId, documentoTipoId: documentType.id, anulado: false })
      .andWhere('c.cite IS NOT NULL AND c.numeroCite IS NOT NULL')
      .orderBy('c.id', 'DESC');

    const ultimoCite = await queryBuilder.getOne();
    const numberCite = (ultimoCite && ultimoCite.numberCite) ?? 0;

    const entidad = await this.entidadRepository.findOne(entidadId, {
      loadEagerRelations: false,
    });

    const unidad = await this.unidadRepository.findOne(unidadId, {
      loadEagerRelations: false,
    });

    const entidadAbrev = entidad.abbreviation.toUpperCase();
    const unidadAbrev = unidad.abbreviation.toUpperCase();
    const documentTypeAbrev = documentType.abreviation.toUpperCase();
    const nextNumber = +numberCite + 1;

    const textCite = `${entidadAbrev}/${unidadAbrev}/${documentTypeAbrev} N° 000${nextNumber}/${gestion}`;

    return {
      entidadAbrev,
      unidadAbrev,
      documentTypeAbrev,
      textCite,
      citeNumber: nextNumber,
      gestion,
      entidadId: entidad.id,
      unidadId: unidad.id,
      documentTypeId: documentType.id,
      entidad,
      unidad,
      documentType,
      funcionarioId,
      oficinaId,
    };
  }

  nextChar(c: string) {
    return c.length ? String.fromCharCode(c.charCodeAt(0) + 1) : 'A';
  }

  async saveDocument(
    userData: UserDataPayload,
    correspondenciaId: number,
    derivationId: number,
    reference: string,
  ): Promise<GroupDocument> {
    const docTemp: GroupDocument = this.documentRepository.create({
      funcionarioId: userData.funcionarioId,
      correspondenciaId,
      derivationId,
      reference,
    });

    return await this.documentRepository.save(docTemp);
  }

  async loadFirma(firmaFisicaId): Promise<string> {
    const response: IResponse = await msFilesRead(firmaFisicaId)
      .then((resp) => resp)
      .catch((err) => err);

    if (response.error) return '';
    return `<img id="base64image" src="data:image/png;base64,${response.response.base64}" alt="firma" style="height:80px; with: 170px;" />`;
  }

  getCiteFromTags(tagsSistema: { tag: string; value: string; showInFront: boolean }[]): string {
    const { value } = tagsSistema.find((el) => el.tag == '#citesFuncionariosCompartidos#');
    return value ? value : '';
  }

  async loadFirmasArray(firmasFisicasIds: string[]): Promise<string> {
    // filter nulls, undefined, then remove duplicates
    firmasFisicasIds = [...new Set(firmasFisicasIds.filter((el) => !!el))];

    const firmasLoaded: IResponse[] = await Promise.all(
      firmasFisicasIds.map(async (firmaId) => {
        const result = await msFilesRead(firmaId)
          .then((result) => result)
          .catch((e) => e);
        return result;
      }),
    );

    const arrayFirmas = firmasLoaded.map((response: IResponse) => {
      if (response.error) {
        // saveLogs(response.error)
      } else {
        return `<img id="base64image" src="data:image/png;base64,${response.response.base64}" alt="firma" style="height:80px; with: 170px;" />`;
      }
    });
    return arrayFirmas.join('');
  }

  async loadFirmantesDocumento(funcionariosData: FuncionariosPayload[]): Promise<string> {
    // filter nulls, undefined, then remove duplicates
    // const firmasFisicasIds = funcionariosData.map((el) => el.firmaFisicaId).filter((el) => !!el);

    const firmasLoaded: IResponse[] = await Promise.all(
      funcionariosData.map(async (func) => {
        const result = await msFilesRead(func.firmaFisicaId)
          .then((result) => {
            if (result.response) {
              result.response = { ...func, ...result.response };
              return result;
            }
          })
          .catch((e) => e);
        return result;
      }),
    );

    const arrayFirmas = [...new Set(firmasLoaded)].map((response: IResponse) => {
      if (response.error) {
        // saveLogs(response.error)
      } else {
        const { nombresApellidos, cargo, unidad, entidad, base64 } = response.response;
        const firmaFormateada = `
        <br />
        <p class="my-0"><strong><img id="base64image" src="data:image/png;base64,${base64}" alt="firma" style="height:80px; with: 170px;" /></strong></p>
        <p class="my-0"><span class="text-small">${nombresApellidos}</span></p>
        <p class="my-0">
          <span class="text-small">
            <i><strong>${cargo}</strong></i>
          </span>
        </p>
        <p class="my-0">
          <span class="text-small" style="background-color: hsl(0, 0%, 100%); color: hsl(210, 75%, 60%)" >
            <strong>${unidad}</strong>
          </span>
        </p>
        <p class="my-0">
          <span class="text-small"><strong>${entidad}</strong></span>
        </p>`;
        return firmaFormateada;
      }
    });
    return arrayFirmas.join(' ');
  }

  async replaceGlobalTags(
    userData: UserDataPayload,
    content: string,
    documentType: DocumentType,
    firmasFuncionarios: FuncionariosPayload[],
  ) {
    const lastCite: UltimoCite = await this.getUltimoCiteDocument({
      entidadId: userData.entidadId,
      oficinaId: userData.oficinaId,
      unidadId: userData.unidadId,
      funcionarioId: userData.funcionarioId,
      documentType,
    });

    const citesCompartidos: UltimoCite[] = await this.getLastCitesArray(
      firmasFuncionarios,
      documentType,
    );

    const tagsSistema = [
      // institutionAbrev
      // entidadAbrev
      // unidadAbrev
      // { showInFront:true, tag: '#tipoDocumento#', value: HoraMS() },
      // { showInFront:true, tag: '#hojaRuta#', value: HoraMS() },
      {
        tag: '#firmaFisica#',
        value: userData.firmaFisicaId ? await this.loadFirma(userData.firmaFisicaId) : '',
        showInFront: true,
        // value: await this.loadFirmasArray(firmasFuncionarios.map((el) => el.firmaFisicaId)),
      },
      // { showInFront:true, tag: '#email#', value: 'Ing.' },
      // { showInFront:true, tag: '#numeroTelefono#', value: 'Ing.' },
      // { showInFront:true, tag: '#direccionEmisor#', value: 'Ing.' },
      {
        tag: '#gradoAcademico#',
        value: userData.gradoAcademico ? userData.gradoAcademico : '',
        showInFront: true,
      },
      {
        tag: '#profesionOcupacion#',
        value: userData.profesionOcupacion ? userData.profesionOcupacion : '',
        showInFront: true,
      },
      {
        tag: '#gradoAbrev#',
        value: userData.gradoAbrev ? userData.gradoAbrev : '',
        showInFront: true,
      },
      { tag: '#institucion#', value: userData.institucion, showInFront: true },
      { tag: '#entidadEmisor#', value: userData.entidad, showInFront: true },
      { tag: '#unidadEmisor#', value: userData.unidad, showInFront: true },
      { tag: '#funcionarioEmisor#', value: userData.nombresApellidos, showInFront: true },
      { tag: '#cargoEmisor#', value: userData.cargo, showInFront: true },
      { tag: '#numeroDocumento#', value: userData.numeroDocumento, showInFront: true },
      { tag: '#nroCite#', value: lastCite.textCite, showInFront: true },
      { tag: '#fecha#', value: dateTimeNow().toString(), showInFront: true },
      { tag: '#fechaYMD#', value: fechaYMD(), showInFront: true },
      { tag: '#fechaDMY#', value: fechaDMY(), showInFront: true },
      { tag: '#fechaYMDHora#', value: fechaHoraYMD(), showInFront: true },
      { tag: '#fechaDMYHora#', value: fechaHoraDMY(), showInFront: true },

      { tag: '#HoraM#', value: HoraM(), showInFront: true },
      { tag: '#HoraMS#', value: HoraMS(), showInFront: true },
      { tag: '#gestion#', value: lastCite.gestion.toString(), showInFront: true },
      { tag: '#fechaLiteralMinuscula#', value: fechaLiteralMinuscula(), showInFront: true },
      { tag: '#fechaLiteralMayuscula#', value: fechaLiteralMayuscula(), showInFront: true },
      { tag: '#diaFechaLiteralMinúscula#', value: diaFechaLiteralMinuscula(), showInFront: true },
      { tag: '#diaFechaLiteralMayuscula#', value: diaFechaLiteralMayuscula(), showInFront: true },
      { tag: '#mesLiteralMinuscula#', value: mesLiteralMinuscula(), showInFront: true },
      { tag: '#mesLiteralMayuscula#', value: mesLiteralMayuscula(), showInFront: true },
      { tag: '#diaLiteralMinuscula#', value: diaSemanaLiteralMinuscula(), showInFront: true },
      { tag: '#diaLiteralMayuscula#', value: diaSemanaLiteralMayuscula(), showInFront: true },
      {
        tag: '#diaFechaLiteralHoraMinuscula#',
        value: diaFechaLiteralHoraMinuscula(),
        showInFront: true,
      },
      {
        tag: '#diaFechaLiteralHoraMayuscula#',
        value: diaFechaLiteralHoraMayuscula(),
        showInFront: true,
      },
      {
        tag: '#fechaLiteralCompletaMinuscula#',
        value: fechaLiteralCompletaMinuscula(),
        showInFront: true,
      },
      {
        tag: '#fechaLiteralCompletaMayuscula#',
        value: fechaLiteralCompletaMayuscula(),
        showInFront: true,
      },
      {
        tag: '#citesFuncionariosCompartidos#',
        value: this.mapFilterDuplJoinArray(citesCompartidos, 'textCite'),
        showInFront: true,
      },
      {
        tag: '#funcionariosFirmantes#',
        value: await this.loadFirmantesDocumento(firmasFuncionarios),
        showInFront: false,
      },
      {
        tag: '#unidadesCompartidas#',
        value: this.mapFilterDuplJoinArray(firmasFuncionarios, 'unidad'),
        showInFront: true,
      },
      {
        tag: '#entidadesCompartidas#',
        value: this.mapFilterDuplJoinArray(firmasFuncionarios, 'entidad'),
        showInFront: true,
      },
      {
        tag: '#nombresFuncionariosCompartidos#',
        value: this.mapFilterDuplJoinArray(firmasFuncionarios, 'nombresApellidos'),
        showInFront: true,
      },
    ];

    tagsSistema.forEach((el) => {
      content = content.replace(new RegExp(el.tag, 'g'), el.value);
    });
    return { content, tagsSistema: tagsSistema.filter((el) => el.showInFront), citesCompartidos };
  }

  /**
   * funcion que mapea un array para un campo, filtra nulos,
   * remueve duplicados y contatena el texto para retornar
   * @param arrayItems any
   * @param field
   * @param separator
   * @returns
   */
  mapFilterDuplJoinArray(arrayItems: any[], field: string, separator = ', '): string {
    let items = arrayItems.map((el) => el[field]).filter((el) => !!el);
    items = [...new Set(items)];
    return items.join(separator);
  }

  /**
   * Servicio para generar pdf con un nuevo registro
   * @param user
   * @param mainFile
   * @param document
   * @param correspondence
   * @param documentType
   * @returns
   */
  async generateAndSavedDocFilePdf(
    userData: UserDataPayload,
    documentoRedactado: MainFileInput,
    document: GroupDocument,
    correspondence: Correspondence,
    documentType: DocumentType,
    updateCorresp = false,
    generatedNewCite = false,
    generarNuevasFirmas = false,
    updateFile = false,
  ): Promise<DocFile> {
    const {
      contentBody,
      originalname,
      formatPage,
      privacy,
      description,
      pageOrientation,
      firmasIds,
      createdAt,
    } = documentoRedactado;

    const funcionariosByTags = await this.getFuncionariosData(userData, firmasIds);

    const { content, citesCompartidos } = await this.replaceGlobalTags(
      userData,
      contentBody + `<br /> #funcionariosFirmantes#`,
      documentType,
      updateFile ? [] : funcionariosByTags,
    );
    const contenidoHtml = content;

    // const { width, height, margintop, marginbottom, marginleft, marginright } = options;
    const fileCode = this.uniqFileCodeGenerator(
      document ? document.id : null,
      correspondence ? correspondence.id : null,
    );
    const cite = [...new Set(citesCompartidos.map((el) => el.textCite))].join(', ');

    const dataJson: DtoPdfRender = {
      title: userData.institucion,
      subtitle: userData.entidad,
      formatPage,
      pageOrientation,
      fileCode,
      hojaRuta: correspondence.hojaRuta,
      tipoDocumento: documentType.name,
      content: contenidoHtml,
      createdAt,
    };

    const respo = await msPdfRender(dataJson)
      .then(async (e) => {
        const fileBase64 = e.response.base64;
        // const response = await writeBase64ToFile(originalname, fileBase64);
        // ===save in ms files===
        const { error, response, message }: IResponse = await msWriteFile({
          path: 'correspondencia/files',
          file: `${originalname}.pdf`,
          base64: fileBase64,
          withDateSubFolder: true,
        })
          .then((result) => result)
          .catch((e) => e);

        if (error) {
          throw new BadRequestException(message);
        }

        const fileInformation: FilesInput = {
          msFilesId: response.id,
          filename: response.fileName,
          path: response.fullPath,
          originalname: response.originalName,
          size: response.size,
          sha256: response.sha256,
          extension: `.${response.extension}`,
          privacy,
          description,
          contenido: contenidoHtml,
        };
        const docFile = await this.saveDocFile(
          userData,
          fileInformation,
          document,
          correspondence,
          document ? document.derivationId : null,
          documentType.id,
          fileCode,
          true,
        );
        if (updateCorresp) {
          this.correspRepository.update(correspondence.id, { docPrincipalId: docFile.id, cite });
          // this.documentRepository.update(document.id, { cite });
        }

        // guardar los cites que incorpora el documento
        if (generatedNewCite) {
          Promise.all(
            citesCompartidos.map(async (cite) => {
              const citeDocumentTemp = this.citesRepository.create({
                correspondence,
                document,
                archivoId: docFile.id,
                tipoDocumento: documentType,
                entidad: cite.entidad,
                oficinaId: cite.oficinaId,
                unidad: cite.unidad,
                numberCite: cite.citeNumber,
                gestion: cite.gestion,
                cite: cite.textCite,
                funcionarioId: cite.funcionarioId,
                anulado: false,
              });
              this.citesRepository.save(citeDocumentTemp);
            }),
          );
        }

        // guardar las firmas que incorpora el documento
        if (generarNuevasFirmas) {
          Promise.all(
            funcionariosByTags.map(async (firma) => {
              const firmaDocumentTemp = this.firmasRepository.create({
                document,
                archivoId: docFile.id,
                funcionarioId: firma.funcionarioId,
                firmaFisicaId: firma.firmaFisicaId,
              });
              this.firmasRepository.save(firmaDocumentTemp);
            }),
          );
        }
        return docFile;
      })
      .catch((error) => {
        throw new BadRequestException(error);
      });
    if (!respo) throw new BadRequestException(`el archivo no fue cargado`);

    return respo;
  }

  async verifyExistsFiles(files: FilesInput[]): Promise<boolean> {
    files.forEach((element) => {
      // "path": "./uploads/files/documentos/temporal/archivo.pdf",
      const response = verifyExistsFile(element.path);
      if (response.error) {
        throw new BadRequestException(
          `el archivo ${element.originalname} no existe, o no fue cargado`,
        );
      }
    });

    return true;
  }

  /**
   * servicio para fuardar el pdf
   * @param createdFuncId
   * @param oneFile
   * @param document
   * @param correspondence
   * @param derivacionId
   * @param fileCode
   * @returns
   */
  async saveMainFile(
    user: UserDataPayload,
    oneFile: FilesInput,
    document: GroupDocument,
    correspondence: Correspondence,
    derivacionId: number,
    documentoTipoId: number,
    fileCode: string,
    generadoSistema = false,
  ): Promise<DocFile> {
    const { size, filename, originalname, extension, path, privacy, description } =
      await moveFileTemporalToPath(oneFile);

    const hasFile = await getFileSha256(path);
    const docFileTemp = await this.docFileRepository.create({
      path,
      fileCode,
      documentoId: document ? document.id : null,
      size,
      fileName: filename,
      // contenido: oneFile.contenido,
      originalname,
      extension,
      hasFile,
      isPrivate: privacy === 'CONFIDENCIAL' ? true : false,
      correspondenciaId: correspondence ? correspondence.id : null,
      derivacionId,
      createdFuncId: user.funcionarioId,
      description,
      unidadId: user.unidadId,
      documentoTipoId,
      generadoSistema,
    });
    return await this.docFileRepository.save(docFileTemp).then((docFile) => {
      if (oneFile.contenido) {
        const contentFile = this.fileContentRepository.create({
          archivoId: docFile.id,
          contenido: oneFile.contenido,
        });
        this.fileContentRepository.save(contentFile);
      }
      return docFile;
    });
  }

  /**
   * servicio para fuardar el pdf
   * @param createdFuncId
   * @param oneFile
   * @param document
   * @param correspondence
   * @param derivacionId
   * @param fileCode
   * @returns
   */

  async saveDocFile(
    user: UserDataPayload,
    oneFile: FilesInput,
    document: GroupDocument,
    correspondence: Correspondence,
    derivacionId: number,
    documentoTipoId: number,
    fileCode: string,
    generadoSistema = false,
  ): Promise<DocFile> {
    const { size, filename, originalname, sha256, extension, path, privacy, description } = oneFile;

    const docFileTemp = await this.docFileRepository.create({
      path,
      fileCode,
      documentoId: document ? document.id : null,
      size: size,
      fileName: filename,
      originalname,
      extension,
      hasFile: sha256,
      isPrivate: privacy === 'CONFIDENCIAL' ? true : false,
      correspondenciaId: correspondence ? correspondence.id : null,
      derivacionId,
      createdFuncId: user.funcionarioId,
      description,
      unidadId: user.unidadId,
      documentoTipoId,
      generadoSistema,
      msFilesId: oneFile.msFilesId,
    });
    return await this.docFileRepository.save(docFileTemp).then((docFile) => {
      if (oneFile.contenido) {
        const contentFile = this.fileContentRepository.create({
          archivoId: docFile.id,
          contenido: oneFile.contenido,
        });
        this.fileContentRepository.save(contentFile);
      }
      return docFile;
    });
  }

  async saveFiles(
    user: UserDataPayload,
    files: FilesInput[],
    unidadId: number,
    correspondence: Correspondence = null,
    document: GroupDocument = null,
  ): Promise<DocFile[]> {
    const docFiles: DocFile[] = await Promise.all(
      files.map(async (oneFile) => {
        const fromPath = getTemporalToPath(oneFile);
        const { error, response }: IResponse = await encodeFileToBase64V3(fromPath);
        if (!error) {
          const fileBase64 = response;

          // const response = await writeBase64ToFile(originalname, fileBase64);
          // ===save in ms files===
          return msWriteFile({
            path: 'correspondencia/files',
            file: oneFile.originalname,
            base64: fileBase64,
            withDateSubFolder: true,
          })
            .then(async ({ response }) => {
              const fileCode = this.uniqFileCodeGenerator(
                document ? document.id : null,
                document ? document.correspondenciaId : null,
              );
              const fileInformation: FilesInput = {
                msFilesId: response.id,
                filename: response.fileName,
                path: response.fullPath,
                originalname: response.originalName,
                size: response.size,
                sha256: response.sha256,
                extension: `.${response.extension}`,
                privacy: oneFile.privacy,
                description: oneFile.description,
              };

              const docFile = await this.saveDocFile(
                user,
                fileInformation,
                document,
                correspondence,
                document ? document.derivationId : null,
                null,
                fileCode,
                true,
              );
              return docFile;
            })
            .catch((e) => {
              console.log(e);

              return null;
            });
        }
      }),
    );

    return docFiles.filter((el) => el);
  }

  async saveCollaborators(userData: UserDataPayload, archivoId: number, funcionarioIds: number[]) {
    const funcionarios = await this.getFuncionariosData(userData, [
      ...funcionarioIds,
      userData.funcionarioId,
    ]);

    Promise.all(
      funcionarios.map(async ({ entidad, unidad, nombresApellidos, cargo, funcionarioId }) => {
        const temp = await this.collaboratorRepository.create({
          archivoId,
          funcionarioId,
          nombreEntidadUnidad: `${entidad} - ${unidad}`,
          nombreFuncionarioCargo: `${nombresApellidos} - ${cargo}`,
        });
        this.collaboratorRepository.save(temp);
      }),
    );
  }

  async moveFilesFromTemporal(
    user: UserDataPayload,
    archivoId: number,
    oneFile: FilesInput,
  ): Promise<DocFile> {
    const { size, filename, originalname, extension, path, privacy, description } =
      await moveFileTemporalToPath(oneFile);

    const fileCode = this.uniqFileCodeGenerator(null, null);

    const hasFile = await getFileSha256(path);
    const fileTemp = this.docFileRepository.create({
      fileCode,
      path,
      size,
      fileName: filename,
      originalname,
      extension,
      hasFile,
      isPrivate: privacy === 'CONFIDENCIAL' ? true : false,
      createdFuncId: user.funcionarioId,
      description,
    });

    await this.docFileRepository.update(archivoId, fileTemp);
    return await this.docFileRepository.findOne(archivoId);
  }

  async loadDestinatariosByGroup(grupoEnvio: GrupoMasivo): Promise<FuncionariosDestinoInput[]> {
    const { funcionariosIds, prioridad, tareas } = grupoEnvio;

    if (funcionariosIds.length) {
      const destinatarios: FuncionariosDestinoInput[] = funcionariosIds.map((id) => ({
        destinoId: id,
        name: ' - ',
        adjuntoFisico: false,
        descriptionMaterial: '',
        prioridad,
        tareas,
      }));
      return destinatarios;
    }
    return [];
  }

  async deleteDocFile(
    user: UserPayload,
    archivoId: number,
    fundamentacion: string,
    anularCite = true,
  ): Promise<ResponseMsg> {
    const before = await this.docFileRepository.findOne(archivoId, {
      relations: ['citesDocument'],
    });
    return await this.docFileRepository.update(archivoId, { deleted: true }).then(() => {
      // save Log
      const after: DocFile = { ...before, deleted: true };
      this.generateLog(user, 'DocFile', 'DELETE', fundamentacion, before, after);
      // anular cites de documento
      if (anularCite) {
        const cites = before.citesDocument;
        cites.map(async (cite) => {
          this.citesRepository.update(cite.id, { anulado: true });
        });
      }

      return { message: `Archivo eliminado`, id: null };
    });
  }

  generateLog(
    user: UserPayload,
    entity: string,
    action: string,
    fundamentacion: string,
    beforeData: any,
    afterData: any = null,
  ) {
    // input: CreateLogsInput
    let beforeChange = null;
    let afterChange = null;
    try {
      beforeChange = beforeData ? JSON.stringify(beforeData) : null;
      afterChange = afterData ? JSON.stringify(afterData) : null;
    } catch (error) {}

    const logTemp: CreateLogsInput = this.logsRepository.create({
      funcionarioId: user.funcionarioId,
      entity,
      fundamentacion,
      registroId: beforeData.id,
      action,
      beforeChange,
      afterChange,
    });
    this.logsService.create(logTemp);
  }

  /**
   * obtiene los identificadores de los jefes de una unidad
   * @param unidadId
   * @returns
   */
  async getIdsJefesOfUnidad(unidadId: number): Promise<number[]> {
    const ids = (
      await this.officialRepository.find({
        where: { unidadId, isManager: true },
        loadEagerRelations: false,
        select: ['id'],
      })
    ).map((of) => of.id);
    return ids;
  }
}

export default RepoService;
