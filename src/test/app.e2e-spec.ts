import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from '../auth/dto';
import { EditUserDto } from './../user/dto';
import { EditBookmarkDto } from './../bookmark/dto';
import { CreateBookmarkDto } from './../bookmark/dto';

describe('App e2e', () => {
   let app: INestApplication;
   let prisma: PrismaService;
   beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
         imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
         new ValidationPipe({
            whitelist: true,
         }),
      );
      await app.init();
      app.listen(3333);

      prisma = app.get(PrismaService);
      await prisma.cleanDb();
      pactum.request.setBaseUrl('http://localhost:3333');
   });

   afterAll(() => {
      app.close();
   });

   describe('Auth', () => {
      const dto: AuthDto = {
         email: 'test2@gmail.com',
         password: '123',
      };

      describe('Signup', () => {
         it('should throw an exception if emil is empty', () => {
            return pactum.spec().post('/auth/signup').withBody({ password: dto.password }).expectStatus(400);
         });

         it('should throw an exception if password is empty', () => {
            return pactum.spec().post('/auth/signup').withBody({ email: dto.email }).expectStatus(400);
         });

         it('should throw an exception if no body provided', () => {
            return pactum.spec().post('/auth/signup').expectStatus(400);
         });

         it('should signup', () => {
            return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201);
         });
      });
      describe('Signin', () => {
         it('should throw an exception if emil is empty', () => {
            return pactum.spec().post('/auth/signin').withBody({ password: dto.password }).expectStatus(400);
         });

         it('should throw an exception if password is empty', () => {
            return pactum.spec().post('/auth/signin').withBody({ email: dto.email }).expectStatus(400);
         });

         it('should throw an exception if no body provided', () => {
            return pactum.spec().post('/auth/signin').expectStatus(400);
         });
         it('should signin', () => {
            return pactum
               .spec()
               .post('/auth/signin')
               .withBody(dto)
               .expectStatus(200)
               .stores('userAt', 'accessToken');
         });
      });
   });

   describe('User', () => {
      describe('Get me', () => {
         it('should get current user', () => {
            return pactum
               .spec()
               .get('/users/me')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200);
         });
      });

      describe('Edit user', () => {
         it('should update user by id', () => {
            const dto: EditUserDto = {
               firstName: 'Konstantin',
               email: 'kostya@mail.com',
            };
            return pactum
               .spec()
               .patch('/users/update')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .withBody(dto)
               .expectStatus(200);
         });
      });
   });

   describe('Bookmarks', () => {
      describe('Get empty bookmarks', () => {
         it('should get empty bookmarks', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectBody([]);
         });
      });

      describe('Create bookmark', () => {
         const dto: CreateBookmarkDto = {
            title: 'New Bookmark',
            link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=1576s',
         };
         it('should create bookmark', () => {
            return pactum
               .spec()
               .post('/bookmarks/create')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .withBody(dto)
               .expectStatus(201)
               .stores('bookmarkId', 'id');
         });
      });

      describe('Get bookmarks', () => {
         it('should get bookmarks', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectJsonLength(1);
         });
      });

      describe('Get bookmark by ID', () => {
         it('should get bookmark by ID', () => {
            return pactum
               .spec()
               .get('/bookmarks/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200);
         });
      });

      describe('Edit bookmark by ID', () => {
         const dto: EditBookmarkDto = {
            description: 'Updated description',
            title: 'Updated Title',
            link: 'https://kino-gavno.com',
         };
         it('should edit bookmark by ID', () => {
            return pactum
               .spec()
               .patch('/bookmarks/edit/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withBody(dto)
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectBodyContains(dto.title)
               .expectBodyContains(dto.description)
               .expectBodyContains(dto.link);
         });
      });

      describe('Delete bookmark by ID', () => {
         it('should delete bookmark by ID', () => {
            return pactum
               .spec()
               .delete('/bookmarks/delete/{id}')
               .withPathParams('id', '$S{bookmarkId}')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(204);
         });

         it('[] of bookmarks should be empty', () => {
            return pactum
               .spec()
               .get('/bookmarks')
               .withHeaders({ Authorization: 'Bearer $S{userAt}' })
               .expectStatus(200)
               .expectJsonLength(0);
         });
      });
   });
});
