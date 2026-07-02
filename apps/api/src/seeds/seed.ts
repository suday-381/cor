import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Department } from '../modules/master-data/entities/department.entity';
import { ChartOfAccount } from '../modules/master-data/entities/chart-of-account.entity';
import { RkapCycle } from '../modules/rkap-cycle/entities/rkap-cycle.entity';
import { MacroAssumption } from '../modules/rkap-cycle/entities/macro-assumption.entity';
import { CycleVersion } from '../modules/rkap-cycle/entities/cycle-version.entity';
import { ApprovalWorkflow } from '../modules/workflow/entities/approval-workflow.entity';
import databaseConfig from '../config/database.config';
import * as bcrypt from 'bcrypt';

const config = databaseConfig() as any;

async function seed() {
  const dataSource = new DataSource({
    ...config,
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Clear existing data (optional - comment out to preserve)
    console.log('🗑️  Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE approval_comments CASCADE');
    await dataSource.query('TRUNCATE TABLE approval_stages CASCADE');
    await dataSource.query('TRUNCATE TABLE approval_workflows CASCADE');
    await dataSource.query('TRUNCATE TABLE balance_sheet_snapshots CASCADE');
    await dataSource.query('TRUNCATE TABLE cashflow_snapshots CASCADE');
    await dataSource.query('TRUNCATE TABLE pnl_snapshots CASCADE');
    await dataSource.query('TRUNCATE TABLE capex_items CASCADE');
    await dataSource.query('TRUNCATE TABLE personnel_costs CASCADE');
    await dataSource.query('TRUNCATE TABLE cost_line_items CASCADE');
    await dataSource.query('TRUNCATE TABLE revenue_line_items CASCADE');
    await dataSource.query('TRUNCATE TABLE cycle_versions CASCADE');
    await dataSource.query('TRUNCATE TABLE macro_assumptions CASCADE');
    await dataSource.query('TRUNCATE TABLE rkap_cycles CASCADE');
    await dataSource.query('TRUNCATE TABLE chart_of_accounts CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');
    await dataSource.query('TRUNCATE TABLE departments CASCADE');

    // 1. Create Departments & Divisions
    console.log('📁 Creating departments and divisions...');
    const deptRepository = dataSource.getRepository(Department);
    
    const divisions = await Promise.all([
      deptRepository.save({
        code: 'DIV_OPERATIONS',
        name: 'Operations Division',
        isRevenueCenter: false,
        sortOrder: 1,
      }),
      deptRepository.save({
        code: 'DIV_SALES',
        name: 'Sales Division',
        isRevenueCenter: true,
        sortOrder: 2,
      }),
      deptRepository.save({
        code: 'DIV_FINANCE',
        name: 'Finance Division',
        isRevenueCenter: false,
        sortOrder: 3,
      }),
    ]);

    // Create departments under divisions
    const departments = await Promise.all([
      // Operations departments
      deptRepository.save({
        code: 'DEPT_IT',
        name: 'IT Department',
        parentId: divisions[0].id,
        sortOrder: 1,
        headCount: 15,
      }),
      deptRepository.save({
        code: 'DEPT_HR',
        name: 'Human Resources',
        parentId: divisions[0].id,
        sortOrder: 2,
        headCount: 8,
      }),
      // Sales departments
      deptRepository.save({
        code: 'DEPT_SALES_REGIONAL',
        name: 'Regional Sales',
        parentId: divisions[1].id,
        sortOrder: 1,
        headCount: 25,
      }),
      deptRepository.save({
        code: 'DEPT_SALES_ENTERPRISE',
        name: 'Enterprise Sales',
        parentId: divisions[1].id,
        sortOrder: 2,
        headCount: 12,
      }),
      // Finance departments
      deptRepository.save({
        code: 'DEPT_FIN',
        name: 'Finance Department',
        parentId: divisions[2].id,
        sortOrder: 1,
        headCount: 20,
      }),
      deptRepository.save({
        code: 'DEPT_ACC',
        name: 'Accounting Department',
        parentId: divisions[2].id,
        sortOrder: 2,
        headCount: 18,
      }),
    ]);

    console.log(`✅ Created ${divisions.length} divisions and ${departments.length} departments`);

    // 2. Create Chart of Accounts
    console.log('📊 Creating chart of accounts...');
    const coaRepository = dataSource.getRepository(ChartOfAccount);

    const revenueAccounts = await Promise.all([
      coaRepository.save({
        code: '4001',
        name: 'Product Sales Revenue',
        accountType: 'revenue',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '4002',
        name: 'Service Revenue',
        accountType: 'revenue',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '4003',
        name: 'Other Revenue',
        accountType: 'revenue',
        level: 1,
        isActive: true,
      }),
    ]);

    // Create parent expense accounts first
    const parentExpenseAccounts = await Promise.all([
      coaRepository.save({
        code: '5001',
        name: 'Cost of Goods Sold',
        accountType: 'expense',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '5101',
        name: 'Personnel Costs',
        accountType: 'expense',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '5201',
        name: 'Operating Expenses',
        accountType: 'expense',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '5202',
        name: 'IT & Software Costs',
        accountType: 'expense',
        level: 1,
        isActive: true,
      }),
      coaRepository.save({
        code: '6001',
        name: 'Depreciation',
        accountType: 'expense',
        level: 1,
        isActive: true,
      }),
    ]);

    // Create child expense account
    const childExpenseAccount = await coaRepository.save({
      code: '5102',
      name: 'Salaries & Wages',
      accountType: 'expense',
      parentId: parentExpenseAccounts[1].id,
      level: 2,
      isActive: true,
    });

    const costAccounts = [...parentExpenseAccounts, childExpenseAccount];

    console.log(`✅ Created ${revenueAccounts.length + costAccounts.length} chart of accounts`);

    // 3. Create Users with different roles
    console.log('👥 Creating users...');
    const userRepository = dataSource.getRepository(User);

    const users = await Promise.all([
      userRepository.save({
        email: 'admin@corplan.com',
        name: 'System Administrator',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'super_admin',
        departmentId: divisions[2].id,
        isActive: true,
      }),
      userRepository.save({
        email: 'cfo@corplan.com',
        name: 'Chief Financial Officer',
        passwordHash: await bcrypt.hash('cfo123', 10),
        role: 'cfo',
        departmentId: departments[4].id,
        isActive: true,
      }),
      userRepository.save({
        email: 'csp@corplan.com',
        name: 'Corporate Strategic Planning',
        passwordHash: await bcrypt.hash('csp123', 10),
        role: 'csp',
        departmentId: departments[4].id,
        isActive: true,
      }),
      userRepository.save({
        email: 'gm.operations@corplan.com',
        name: 'Operations General Manager',
        passwordHash: await bcrypt.hash('gm123', 10),
        role: 'gm',
        departmentId: divisions[0].id,
        isActive: true,
      }),
      userRepository.save({
        email: 'budget.owner@corplan.com',
        name: 'IT Budget Owner',
        passwordHash: await bcrypt.hash('budget123', 10),
        role: 'budget_owner',
        departmentId: departments[0].id,
        isActive: true,
      }),
      userRepository.save({
        email: 'viewer@corplan.com',
        name: 'Report Viewer',
        passwordHash: await bcrypt.hash('viewer123', 10),
        role: 'viewer',
        departmentId: departments[2].id,
        isActive: true,
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // 4. Create RKAP Cycles with valid UUIDs
    console.log('🔄 Creating RKAP cycles...');
    const cycleRepository = dataSource.getRepository(RkapCycle);

    const cycles = await Promise.all([
      cycleRepository.save({
        fiscalYear: 2027,
        periodType: 'monthly',
        status: 'draft',
        createdBy: users[0].id,
      }),
      cycleRepository.save({
        fiscalYear: 2026,
        periodType: 'monthly',
        status: 'in_review',
        createdBy: users[0].id,
      }),
      cycleRepository.save({
        fiscalYear: 2025,
        periodType: 'quarterly',
        status: 'locked',
        lockedAt: new Date().toISOString(),
        createdBy: users[0].id,
      }),
    ]);

    console.log(`✅ Created ${cycles.length} RKAP cycles with valid UUIDs`);
    console.log(`   - Cycle 2027 (Draft): ${cycles[0].id}`);
    console.log(`   - Cycle 2026 (In Review): ${cycles[1].id}`);
    console.log(`   - Cycle 2025 (Locked): ${cycles[2].id}`);

    // 5. Create Macro Assumptions
    console.log('💰 Creating macro assumptions...');
    const macroRepository = dataSource.getRepository(MacroAssumption);

    const macros = await Promise.all([
      macroRepository.save({
        cycleId: cycles[0].id,
        inflationRate: 3.5,
        exchangeRateUsdIdr: 15200,
        biInterestRate: 5.75,
        industryGrowthRate: 4.2,
        commodityPrices: {
          palm_oil: 850,
          rubber: 1200,
          coal: 85,
        },
        taxRate: 22.0,
      }),
      macroRepository.save({
        cycleId: cycles[1].id,
        inflationRate: 3.2,
        exchangeRateUsdIdr: 15100,
        biInterestRate: 5.5,
        industryGrowthRate: 3.8,
        commodityPrices: {
          palm_oil: 820,
          rubber: 1180,
          coal: 80,
        },
        taxRate: 22.0,
      }),
      macroRepository.save({
        cycleId: cycles[2].id,
        inflationRate: 2.8,
        exchangeRateUsdIdr: 15000,
        biInterestRate: 5.25,
        industryGrowthRate: 3.5,
        commodityPrices: {
          palm_oil: 800,
          rubber: 1150,
          coal: 75,
        },
        taxRate: 22.0,
      }),
    ]);

    console.log(`✅ Created ${macros.length} macro assumptions`);

    // 6. Create Cycle Versions
    console.log('📝 Creating cycle versions...');
    const versionRepository = dataSource.getRepository(CycleVersion);

    const versions = await Promise.all([
      versionRepository.save({
        cycleId: cycles[0].id,
        version: 1,
        createdBy: users[0].id,
        changeNote: 'Initial cycle creation',
      }),
      versionRepository.save({
        cycleId: cycles[1].id,
        version: 1,
        createdBy: users[0].id,
        changeNote: 'Initial cycle creation',
      }),
      versionRepository.save({
        cycleId: cycles[1].id,
        version: 2,
        createdBy: users[1].id,
        changeNote: 'Budget adjustments approved',
      }),
      versionRepository.save({
        cycleId: cycles[2].id,
        version: 1,
        createdBy: users[0].id,
        changeNote: 'Initial cycle creation',
      }),
      versionRepository.save({
        cycleId: cycles[2].id,
        version: 2,
        createdBy: users[1].id,
        changeNote: 'Final approval',
      }),
    ]);

    console.log(`✅ Created ${versions.length} cycle versions`);

    // 7. Create Approval Workflows
    console.log('✅ Creating approval workflows...');
    const workflowRepository = dataSource.getRepository(ApprovalWorkflow);

    const workflows = await Promise.all([
      workflowRepository.save({
        cycleId: cycles[0].id,
        divisionId: divisions[0].id,
        documentStatus: 'Draft',
        currentApprovalStage: 0,
        createdBy: users[0].id,
        assignedTo: users[3].id,
      }),
      workflowRepository.save({
        cycleId: cycles[0].id,
        divisionId: divisions[1].id,
        documentStatus: 'Draft',
        currentApprovalStage: 0,
        createdBy: users[0].id,
        assignedTo: users[2].id,
      }),
      workflowRepository.save({
        cycleId: cycles[1].id,
        divisionId: divisions[0].id,
        documentStatus: 'Approved',
        currentApprovalStage: 3,
        createdBy: users[0].id,
        approvedBy: users[1].id,
      }),
      workflowRepository.save({
        cycleId: cycles[1].id,
        divisionId: divisions[1].id,
        documentStatus: 'Approved',
        currentApprovalStage: 3,
        createdBy: users[0].id,
        approvedBy: users[1].id,
      }),
    ]);

    console.log(`✅ Created ${workflows.length} approval workflows`);

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📋 Test Login Credentials:');
    console.log('   Super Admin: admin@corplan.com / admin123');
    console.log('   CFO: cfo@corplan.com / cfo123');
    console.log('   CSP: csp@corplan.com / csp123');
    console.log('   GM Operations: gm.operations@corplan.com / gm123');
    console.log('   Budget Owner: budget.owner@corplan.com / budget123');
    console.log('   Viewer: viewer@corplan.com / viewer123');

    console.log('\n🔗 Test Cycle IDs (use in API calls):');
    cycles.forEach((cycle, index) => {
      console.log(`   Cycle ${cycle.fiscalYear} (${cycle.status}): ${cycle.id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
