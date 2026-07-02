import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Department } from '../master-data/entities/department.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['department'] });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, isActive: true },
      relations: ['department'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(userData: Partial<User> & { department?: string }): Promise<User> {
    const user = new User();
    
    // Resolve department by name if provided as a string
    if (userData.department && typeof userData.department === 'string') {
      const dept = await this.departmentsRepository.findOne({
        where: { name: userData.department },
      });
      if (dept) {
        user.department = dept;
        user.departmentId = dept.id;
      }
    }
    
    // Remove department name string to prevent Object.assign mismatch
    const { department, ...cleanUserData } = userData;
    Object.assign(user, cleanUserData);

    const passwordToHash = userData.passwordHash || 'password123';
    user.passwordHash = await bcrypt.hash(passwordToHash, 10);

    const saved = await this.usersRepository.save(user);
    return this.findOne(saved.id);
  }

  async update(id: string, updates: Partial<User> & { department?: string }): Promise<User> {
    const user = await this.findOne(id);
    
    if (updates.passwordHash) {
      updates.passwordHash = await bcrypt.hash(updates.passwordHash, 10);
    }

    if (updates.department !== undefined) {
      if (updates.department && typeof updates.department === 'string') {
        const dept = await this.departmentsRepository.findOne({
          where: { name: updates.department },
        });
        if (dept) {
          user.department = dept;
          user.departmentId = dept.id;
        } else {
          user.department = null as any;
          user.departmentId = null as any;
        }
      } else if (!updates.department) {
        user.department = null as any;
        user.departmentId = null as any;
      }
      delete updates.department;
    }

    Object.assign(user, updates);
    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user);
  }
}
