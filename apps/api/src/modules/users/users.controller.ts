import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private mapUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department?.name || null,
      departmentId: user.departmentId || null,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => this.mapUser(u));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return this.mapUser(user);
  }

  @Post()
  async create(@Body() userData: any) {
    const user = await this.usersService.create(userData);
    return this.mapUser(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: any) {
    const user = await this.usersService.update(id, updates);
    return this.mapUser(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
