// import { Usuario } from '@App/apis/usuario/usuario.entity';
// import { ApiBadRequestError } from '@App/utils/custom-exceptions.helper';
// import {
//   ArgumentMetadata,
//   Inject,
//   Injectable,
//   PipeTransform,
// } from '@nestjs/common';
// import { Repository } from 'typeorm';
// import validate = require('uuid-validate');
// import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// import { OmitType } from '@nestjs/swagger';
// import { plainToInstance } from 'class-transformer';

// /**
//  * class para user, omitiendo la contraseña
//  */
// export class UserPayload extends OmitType(Usuario, [
//   'password',
//   'id',
// ] as const) {
//   userId: number;
//   estadoLiteral: string;
// }

// /**
//  * pipe para gestionar y validar la key uuid
//  */
// @Injectable()
// export class UserPipe implements PipeTransform {
//   constructor(
//     @Inject('USUARIO_REPOSITORY')
//     private usersRepository: Repository<Usuario>,
//   ) {}

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   async transform(
//     userUuid: string,
//     metadata: ArgumentMetadata,
//   ): Promise<UserPayload | null> {
//     if (!userUuid)
//       throw new ApiBadRequestError('userUuid no tiene un valor', 400);

//     if (!validate(userUuid))
//       throw new ApiBadRequestError(
//         `el valor uuid <${userUuid}> no es válido`,
//         406,
//       );

//     try {
//       const user = await this.usersRepository.findOne({
//         where: { uuid: userUuid },
//       });
//       if (!user)
//         throw new ApiBadRequestError('usuario no se encuentra registrado', 406);

//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       const { password, estado, id, ...rest } = user;

//       return plainToInstance(UserPayload, {
//         ...rest,
//         userId: id,
//         estado,
//         estadoLiteral: formatEstado(estado),
//       });
//     } catch (error) {
//       throw new ApiBadRequestError(error, 406);
//     }
//   }
// }

// /**
//  * decorador para obtener al usuario actual logueado
//  */
// export const User = createParamDecorator(
//   (data: string, ctx: ExecutionContext) => {
//     const bodyRequest = ctx.switchToHttp().getRequest().body;

//     const value = data ? bodyRequest[data] : bodyRequest['userUuid'];
//     if (!value)
//       throw new ApiBadRequestError('clave de decorador no válido', 400);

//     return value;
//   },
// );

// const formatEstado = (estado: number): string => {
//   let rolLiteral = 'Usuario bloqueado.';
//   switch (Number(estado)) {
//     case 0:
//       rolLiteral = 'Usuario bloqueado.';
//       break;
//     case 1:
//       rolLiteral = 'Habilitado.';
//       break;
//     case 2:
//       rolLiteral = 'Debe de verificar su número de celular.';
//       break;
//     default:
//       break;
//   }
//   return rolLiteral;
// };
