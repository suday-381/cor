import { Controller, Get } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('departments')
export class DepartmentController {
  constructor(private masterDataService: MasterDataService) {}

  @Get()
  findAll() {
    return this.masterDataService.findAllDepartments();
  }
}

@Controller('coa')
export class CoaController {
  constructor(private masterDataService: MasterDataService) {}

  @Get()
  findAll() {
    return this.masterDataService.findAllCoA();
  }
}
