CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code VARCHAR(2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    login_identifier TEXT NOT NULL,
    email TEXT,
    employee_id VARCHAR(16) NOT NULL,
    password_hash TEXT NOT NULL,
    department TEXT,
    job_title TEXT,
    phone TEXT,
    app_role TEXT NOT NULL,
    supervisor_id UUID REFERENCES users(id),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_date DATE,
    termination_date DATE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, login_identifier),
    UNIQUE(location_id, employee_id)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    content_url TEXT,
    duration_minutes INTEGER,
    category TEXT,
    pass_percentage INTEGER DEFAULT 80,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    assigned_departments TEXT[],
    assigned_positions TEXT[],
    assign_to_entire_company BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    enrolled_date TIMESTAMPTZ DEFAULT NOW(),
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    content_bypassed_batch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,
    completion_date TIMESTAMPTZ,
    quiz_score INTEGER,
    employee_signature_data TEXT,
    employee_signature_date TIMESTAMPTZ,
    supervisor_id UUID REFERENCES users(id),
    supervisor_signature_data TEXT,
    supervisor_signature_date TIMESTAMPTZ,
    approval_status TEXT NOT NULL DEFAULT 'pending_review',
    supervisor_comments TEXT,
    ip_address TEXT,
    verification_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, key)
);

INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Complete-Pet')
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, organization_id, name, code)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Complete-Pet Florida', 'FL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, organization_id, name, code)
VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Complete-Pet Vermont', 'VT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, organization_id, location_id, full_name, login_identifier, email, employee_id, password_hash, department, job_title, app_role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Jean Carmona',
  'jeancarmona@complete-pet.com',
  'jeancarmona@complete-pet.com',
  'EMP001',
  '$2b$12$VWTaXts9FOlBbWvSYlhZX.jYzf.d85AMQKt1Rbbn4SPnlsPLw5C7m',
  'Administration',
  'Global Administrator',
  'global_admin',
  TRUE
)
ON CONFLICT (id) DO NOTHING;
