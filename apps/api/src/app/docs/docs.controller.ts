import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseFilters,
  BadRequestException,
  Get,
  Query,
  Delete,
  Param,
  HttpCode,
  HttpStatus,

} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators';
import { DocsService } from './docs.service';
import { MulterExceptionFilter } from './multer-exception.filter';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Configure multer options
const uploadDir = join(process.cwd(), 'tmp/uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const multerOptions = {
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const ext = extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.md') {
      return callback(
        new BadRequestException('Only PDF and Markdown files are supported'),
        false
      );
    }
    callback(null, true);
  },
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
};

@Controller('v1/docs')
@UseFilters(MulterExceptionFilter)
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Post('upload')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.docsService.uploadFile(file);
  }

  @Get()
  @Roles('admin', 'viewer')
  async listDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.docsService.listDocuments(pageNum, limitNum);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) {
    return this.docsService.deleteDocument(id);
  }
}

