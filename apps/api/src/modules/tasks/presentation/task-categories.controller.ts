import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { CreateTaskCategoryService } from '../application/categories/create-task-category.service.js';
import { DeleteTaskCategoryService } from '../application/categories/delete-task-category.service.js';
import { ListTaskCategoriesService } from '../application/categories/list-task-categories.service.js';
import { UpdateTaskCategoryService } from '../application/categories/update-task-category.service.js';
import {
  CreateTaskCategoryDto,
  UpdateTaskCategoryDto,
} from './dto/task-category.dto.js';

@Controller('tasks/categories')
export class TaskCategoriesController {
  public constructor(
    private readonly listCategories: ListTaskCategoriesService,
    private readonly createCategory: CreateTaskCategoryService,
    private readonly updateCategory: UpdateTaskCategoryService,
    private readonly deleteCategory: DeleteTaskCategoryService,
  ) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.listCategories.execute(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateTaskCategoryDto,
  ) {
    return this.createCategory.execute(principal.userId, input);
  }

  @Patch(':categoryId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @Body() input: UpdateTaskCategoryDto,
  ) {
    return this.updateCategory.execute(principal.userId, categoryId, input);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ): Promise<void> {
    await this.deleteCategory.execute(principal.userId, categoryId);
  }
}
