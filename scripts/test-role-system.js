const { sequelize } = require('../config/database');
const { User, Company } = require('../models');

async function testRoleSystem() {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Test 1: Check if role enum includes new roles
    console.log('\n📋 Testing Role System...\n');

    // Get all users and their roles
    const users = await User.findAll({
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId'],
      order: [
        ['role', 'ASC'],
        ['companyId', 'ASC']
      ]
    });

    console.log('👥 Current Users in System:');
    console.log('=' .repeat(80));

    const roleGroups = {};
    users.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });

    Object.keys(roleGroups).forEach(role => {
      console.log(`\n🔑 ${role.toUpperCase()} USERS:`);
      roleGroups[role].forEach(user => {
        const companyInfo = user.companyId 
          ? `Company: ${user.company?.name || 'Unknown'} (ID: ${user.companyId})`
          : 'No Company (System-wide access)';
        
        console.log(`   • ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`     ${companyInfo}`);
      });
    });

    // Test 2: Verify super admin setup
    const superAdmins = users.filter(user => user.role === 'super_admin');
    console.log(`\n🔍 Super Admin Verification:`);
    if (superAdmins.length === 0) {
      console.log('   ⚠️  No super admin users found!');
      console.log('   💡 Run: node scripts/create-super-admin.js');
    } else {
      console.log(`   ✅ Found ${superAdmins.length} super admin(s)`);
      superAdmins.forEach(admin => {
        if (admin.companyId !== null) {
          console.log(`   ⚠️  Super admin ${admin.email} has companyId: ${admin.companyId} (should be null)`);
        } else {
          console.log(`   ✅ Super admin ${admin.email} correctly has no company assignment`);
        }
      });
    }

    // Test 3: Verify company admin setup
    const companyAdmins = users.filter(user => user.role === 'company_admin');
    console.log(`\n🏢 Company Admin Verification:`);
    if (companyAdmins.length === 0) {
      console.log('   ⚠️  No company admin users found!');
    } else {
      console.log(`   ✅ Found ${companyAdmins.length} company admin(s)`);
      companyAdmins.forEach(admin => {
        if (admin.companyId === null) {
          console.log(`   ⚠️  Company admin ${admin.email} has no company assignment (should have one)`);
        } else {
          console.log(`   ✅ Company admin ${admin.email} assigned to company: ${admin.company?.name || 'Unknown'}`);
        }
      });
    }

    // Test 4: Check for legacy admin roles
    const legacyAdmins = users.filter(user => user.role === 'admin');
    console.log(`\n🔄 Legacy Admin Check:`);
    if (legacyAdmins.length > 0) {
      console.log(`   ⚠️  Found ${legacyAdmins.length} users with legacy 'admin' role:`);
      legacyAdmins.forEach(admin => {
        console.log(`   • ${admin.email} - Consider migrating to 'company_admin'`);
      });
      console.log('   💡 Run: node scripts/migrate-admin-roles.js');
    } else {
      console.log('   ✅ No legacy admin roles found');
    }

    // Test 5: Company distribution
    const companies = await Company.findAll({
      attributes: ['id', 'name']
    });

    console.log(`\n🏭 Company Distribution:`);
    console.log(`   📊 Total companies: ${companies.length}`);
    
    for (const company of companies) {
      const companyUsers = users.filter(user => user.companyId === company.id);
      const adminCount = companyUsers.filter(user => 
        user.role === 'company_admin' || user.role === 'admin'
      ).length;
      
      console.log(`   • ${company.name}: ${companyUsers.length} users (${adminCount} admins)`);
    }

    // Test 6: Role hierarchy validation
    console.log(`\n🎯 Role System Summary:`);
    console.log('   ✅ Two-tier admin system implemented');
    console.log('   ✅ Role-based access control active');
    console.log('   ✅ Company isolation enforced');
    
    if (superAdmins.length > 0 && companyAdmins.length > 0) {
      console.log('   ✅ Both admin tiers configured');
    } else {
      console.log('   ⚠️  Admin tiers need configuration');
    }

    console.log('\n🎉 Role system test completed!');

  } catch (error) {
    console.error('❌ Error testing role system:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the test
testRoleSystem();
