import {
   Controller,
   Delete,
   Get,
   Post,
   UseGuards,
   Body,
   Param,
   ParseIntPipe,
   Patch,
   HttpCode,
   HttpStatus,
} from '@nestjs/common';

import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { BookmarkService } from './bookmark.service';
import { JwtGuard } from './../auth/custom-guard';
import { GetUser } from './../auth/decorator';

@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
   constructor(private bookmarkService: BookmarkService) {}

   @Post('create')
   createBookmark(@GetUser('id') userId: number, @Body() dto: CreateBookmarkDto) {
      return this.bookmarkService.createBookmark(userId, dto);
   }

   @Get()
   getBookmarks(@GetUser('id') userId: number) {
      return this.bookmarkService.getBookmarks(userId);
   }

   @Get(':id')
   getBookmarkById(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookmarkId: number) {
      return this.bookmarkService.getBookmarkById(userId, bookmarkId);
   }

   @Patch('edit/:id')
   editBookmarkById(
      @GetUser('id') userId: number,
      @Param('id', ParseIntPipe) bookmarkId: number,
      @Body() dto: EditBookmarkDto,
   ) {
      return this.bookmarkService.editBookmarkById(userId, bookmarkId, dto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete('delete/:id')
   deleteBookmarkById(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookmarkId: number) {
      return this.bookmarkService.deleteBookmarkById(userId, bookmarkId);
   }
}
