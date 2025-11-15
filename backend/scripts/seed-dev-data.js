import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedDevData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding development data...\n');
    
    await client.query('BEGIN');
    
    // Create organization
    console.log('Creating organization...');
    const orgResult = await client.query(
      `INSERT INTO organizations (name) 
       VALUES ('Complete-Pet Development') 
       ON CONFLICT DO NOTHING
       RETURNING id`
    );
    
    let orgId;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].id;
      console.log(`✅ Organization created: ${orgId}`);
    } else {
      const existingOrg = await client.query('SELECT id FROM organizations LIMIT 1');
      orgId = existingOrg.rows[0].id;
      console.log(`✅ Using existing organization: ${orgId}`);
    }
    
    // Create locations
    console.log('\nCreating locations...');
    const locations = [
      { code: 'FL', name: 'Florida' },
      { code: 'VT', name: 'Vermont' }
    ];
    
    const locationIds = {};
    for (const loc of locations) {
      const locResult = await client.query(
        `INSERT INTO locations (organization_id, name, code) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [orgId, loc.name, loc.code]
      );
      locationIds[loc.code] = locResult.rows[0].id;
      console.log(`✅ Location ${loc.name} (${loc.code}): ${locResult.rows[0].id}`);
    }
    
    // Create test users
    console.log('\nCreating test users...');
    const passwordHash = await bcrypt.hash('12345', 12);
    
    const users = [
      {
        fullName: 'Jean Carmona',
        email: 'jeancarmona@complete-pet.com',
        employeeId: 'FL-0001',
        loginIdentifier: 'jeancarmona@complete-pet.com',
        role: 'global_admin',
        locationCode: 'FL',
        department: 'Administration',
        jobTitle: 'System Administrator'
      },
      {
        fullName: 'Admin User',
        email: 'admin@complete-pet.com',
        employeeId: 'FL-0002',
        loginIdentifier: 'admin@complete-pet.com',
        role: 'admin',
        locationCode: 'FL',
        department: 'Administration',
        jobTitle: 'Administrator'
      },
      {
        fullName: 'John Manager',
        email: 'manager@complete-pet.com',
        employeeId: 'FL-0003',
        loginIdentifier: 'manager@complete-pet.com',
        role: 'manager',
        locationCode: 'FL',
        department: 'Operations',
        jobTitle: 'Operations Manager'
      },
      {
        fullName: 'Jane Supervisor',
        email: 'supervisor@complete-pet.com',
        employeeId: 'FL-0004',
        loginIdentifier: 'supervisor@complete-pet.com',
        role: 'supervisor',
        locationCode: 'FL',
        department: 'Quality',
        jobTitle: 'Quality Supervisor'
      },
      {
        fullName: 'Bob Employee',
        email: 'employee@complete-pet.com',
        employeeId: 'FL-0005',
        loginIdentifier: 'employee@complete-pet.com',
        role: 'employee',
        locationCode: 'FL',
        department: 'Operations',
        jobTitle: 'Technician'
      },
      {
        fullName: 'Alice Vermont Admin',
        email: 'alice@complete-pet.com',
        employeeId: 'VT-0001',
        loginIdentifier: 'alice@complete-pet.com',
        role: 'admin',
        locationCode: 'VT',
        department: 'Administration',
        jobTitle: 'Site Administrator'
      }
    ];
    
    const userIds = {};
    for (const user of users) {
      const userResult = await client.query(
        `INSERT INTO users (
          organization_id, location_id, full_name, email, employee_id,
          login_identifier, password_hash, department, job_title, app_role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (location_id, login_identifier) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name
        RETURNING id`,
        [
          orgId,
          locationIds[user.locationCode],
          user.fullName,
          user.email,
          user.employeeId,
          user.loginIdentifier,
          passwordHash,
          user.department,
          user.jobTitle,
          user.role
        ]
      );
      userIds[user.loginIdentifier] = userResult.rows[0].id;
      console.log(`✅ ${user.fullName} (${user.role}): ${user.loginIdentifier}`);
    }
    
    // Create test courses
    console.log('\nCreating test courses...');
    const courses = [
      {
        title: 'Animal Handling & Safety',
        description: 'Learn proper techniques for handling laboratory animals safely and humanely.',
        contentType: 'video',
        durationMinutes: 45,
        passPercentage: 80,
        isMandatory: true,
        isPublished: true,
        isActive: true,
        questions: [
          {
            question: 'What is the primary consideration when handling laboratory animals?',
            answers: ['Speed', 'Safety and welfare', 'Cost', 'Documentation'],
            correctAnswerIndex: 1
          },
          {
            question: 'How often should animal handling training be refreshed?',
            answers: ['Never', 'Every 5 years', 'Annually', 'Every 6 months'],
            correctAnswerIndex: 2
          },
          {
            question: 'What should you do if an animal shows signs of distress?',
            answers: ['Continue the procedure', 'Stop and assess', 'Ignore it', 'Speed up'],
            correctAnswerIndex: 1
          },
          {
            question: 'Which protective equipment is mandatory?',
            answers: ['Sunglasses', 'Lab coat and gloves', 'Hat', 'Jewelry'],
            correctAnswerIndex: 1
          }
        ]
      },
      {
        title: 'GLP Principles & Compliance',
        description: 'Understanding Good Laboratory Practices and regulatory compliance requirements.',
        contentType: 'pdf',
        durationMinutes: 60,
        passPercentage: 85,
        isMandatory: true,
        isPublished: true,
        isActive: true,
        questions: [
          {
            question: 'What does GLP stand for?',
            answers: ['Good Lab Procedures', 'Good Laboratory Practice', 'General Lab Protocol', 'Great Lab Performance'],
            correctAnswerIndex: 1
          },
          {
            question: 'Who oversees GLP compliance?',
            answers: ['FDA', 'EPA', 'OECD', 'All of the above'],
            correctAnswerIndex: 3
          },
          {
            question: 'How long must study records be retained?',
            answers: ['1 year', '2 years', '5 years', 'As specified by regulations'],
            correctAnswerIndex: 3
          },
          {
            question: 'What is required for data integrity?',
            answers: ['Only digital records', 'Proper documentation and audit trails', 'Manager approval only', 'Annual reviews'],
            correctAnswerIndex: 1
          }
        ]
      },
      {
        title: 'Lab Equipment Maintenance',
        description: 'Proper maintenance and calibration procedures for laboratory equipment.',
        contentType: 'powerpoint',
        durationMinutes: 30,
        passPercentage: 75,
        isMandatory: false,
        isPublished: true,
        isActive: true,
        questions: [
          {
            question: 'How often should equipment be calibrated?',
            answers: ['Never', 'As per manufacturer specs', 'Once a year only', 'Only when broken'],
            correctAnswerIndex: 1
          },
          {
            question: 'What should you do if equipment fails calibration?',
            answers: ['Use it anyway', 'Report and tag out of service', 'Hide it', 'Adjust readings manually'],
            correctAnswerIndex: 1
          },
          {
            question: 'Who can perform equipment maintenance?',
            answers: ['Anyone', 'Trained and authorized personnel', 'Only managers', 'External contractors only'],
            correctAnswerIndex: 1
          },
          {
            question: 'What must be documented after maintenance?',
            answers: ['Nothing', 'Date and time only', 'Complete maintenance log', 'Just the cost'],
            correctAnswerIndex: 2
          }
        ]
      },
      {
        title: 'Biosafety Level 2 Training',
        description: 'Safety protocols and procedures for BSL-2 laboratory work.',
        contentType: 'video',
        durationMinutes: 90,
        passPercentage: 90,
        isMandatory: true,
        isPublished: true,
        isActive: true,
        questions: [
          {
            question: 'What is the minimum PPE for BSL-2?',
            answers: ['Gloves only', 'Lab coat, gloves, eye protection', 'Full hazmat suit', 'Nothing required'],
            correctAnswerIndex: 1
          },
          {
            question: 'How should BSL-2 waste be handled?',
            answers: ['Regular trash', 'Autoclave before disposal', 'Burn immediately', 'Bury it'],
            correctAnswerIndex: 1
          },
          {
            question: 'When should hands be washed in BSL-2?',
            answers: ['End of day only', 'Before and after procedures', 'Never', 'Once a week'],
            correctAnswerIndex: 1
          },
          {
            question: 'What type of cabinet is required for BSL-2?',
            answers: ['Any cabinet', 'Class II biosafety cabinet', 'Regular fume hood', 'No cabinet needed'],
            correctAnswerIndex: 1
          }
        ]
      },
      {
        title: 'Data Integrity & Record Keeping',
        description: 'Best practices for maintaining accurate and compliant records.',
        contentType: 'pdf',
        durationMinutes: 40,
        passPercentage: 85,
        isMandatory: true,
        isPublished: true,
        isActive: true,
        questions: [
          {
            question: 'What is ALCOA+?',
            answers: ['A lab location', 'Data integrity principles', 'Software name', 'Equipment type'],
            correctAnswerIndex: 1
          },
          {
            question: 'Can you modify original data entries?',
            answers: ['Yes, anytime', 'No, use strikethrough and initial', 'Yes, if you tell your boss', 'Delete and rewrite'],
            correctAnswerIndex: 1
          },
          {
            question: 'How should errors be corrected?',
            answers: ['Use whiteout', 'Single line through, date, initial, explain', 'Erase completely', 'Ignore them'],
            correctAnswerIndex: 1
          },
          {
            question: 'What does data traceability mean?',
            answers: ['Data can be traced to source', 'Data is lost', 'Data is encrypted', 'Data is printed'],
            correctAnswerIndex: 0
          }
        ]
      }
    ];
    
    for (const course of courses) {
      const courseResult = await client.query(
        `INSERT INTO courses (
          organization_id, location_id, title, description, content_type,
          duration_minutes, pass_percentage, is_mandatory, is_published, is_active, questions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          orgId,
          locationIds['FL'],
          course.title,
          course.description,
          course.contentType,
          course.durationMinutes,
          course.passPercentage,
          course.isMandatory,
          course.isPublished,
          course.isActive,
          JSON.stringify(course.questions)
        ]
      );
      if (courseResult.rows.length > 0) {
        console.log(`✅ ${course.title}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Development data seeded successfully!\n');
    console.log('📋 Test Credentials:');
    console.log('━'.repeat(60));
    console.log('\n🔑 Login credentials (password for all: 12345)\n');
    
    users.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(15)} | ${user.email.padEnd(35)} | ${user.locationCode}`);
    });
    
    console.log('\n━'.repeat(60));
    console.log('\n🎓 Sample courses created:');
    courses.forEach((course, i) => {
      console.log(`  ${i + 1}. ${course.title} (${course.contentType}, ${course.durationMinutes}min)`);
    });
    
    console.log('\n✅ Ready to test!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDevData();

