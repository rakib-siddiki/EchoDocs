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
import { DocsService } from './docs.service';
import { MulterExceptionFilter } from './multer-exception.filter';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DOCS_CONFIG } from '../constants';


// Configure multer options
const uploadDir = join(process.cwd(), DOCS_CONFIG.UPLOAD_DESTINATION);
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const multerOptions = {
  limits: {
    fileSize: DOCS_CONFIG.MAX_FILE_SIZE,
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!(DOCS_CONFIG.SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
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
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.docsService.uploadFile(file);
  }

  @Get()
  async listDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.docsService.listDocuments(pageNum, limitNum);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) {
    return this.docsService.deleteDocument(id);
  }
}

