import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ============ 1. ORGANIZATIONS & USERS ============
    await queryRunner.query(`
      CREATE TYPE org_type AS ENUM ('customer', 'manufacturer', 'lab', 'partner');
      CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise');
    `);

    await queryRunner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type org_type NOT NULL,
        org_code VARCHAR(50) UNIQUE,
        parent_org_id UUID REFERENCES organizations(id),
        email VARCHAR(255),
        phone VARCHAR(50),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        country VARCHAR(50),
        postal_code VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        verification_date TIMESTAMP,
        subscription_tier subscription_tier DEFAULT 'starter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('analyst', 'qa', 'lab_admin', 'customer', 'manufacturer', 'consumer', 'super_admin');
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        role user_role NOT NULL,
        org_id UUID REFERENCES organizations(id),
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret VARCHAR(255),
        last_login TIMESTAMP,
        login_failures INT DEFAULT 0,
        account_locked BOOLEAN DEFAULT false,
        locked_until TIMESTAMP,
        title VARCHAR(100),
        department VARCHAR(100),
        profile_image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        approval_status VARCHAR(50) DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        jwt_token VARCHAR(500) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 2. PRODUCTS & TESTING ============
    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        upc VARCHAR(50),
        product_code VARCHAR(100) UNIQUE,
        manufacturer_id UUID REFERENCES organizations(id) NOT NULL,
        category VARCHAR(100),
        sub_category VARCHAR(100),
        description TEXT,
        ingredients JSONB,
        specifications JSONB,
        is_active BOOLEAN DEFAULT true,
        requires_certification BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE test_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        method_code VARCHAR(50) UNIQUE NOT NULL,
        method_name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        instrument_type VARCHAR(100),
        version VARCHAR(20),
        is_current BOOLEAN DEFAULT true,
        supersedes_id UUID REFERENCES test_methods(id),
        parameters JSONB,
        acceptance_criteria JSONB,
        iso_17025_standard VARCHAR(50),
        validation_status VARCHAR(50),
        validated_by UUID REFERENCES users(id),
        validation_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE test_panels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        product_type VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE test_panel_methods (
        panel_id UUID REFERENCES test_panels(id) ON DELETE CASCADE NOT NULL,
        method_id UUID REFERENCES test_methods(id) ON DELETE CASCADE NOT NULL,
        order_sequence INT DEFAULT 0,
        is_mandatory BOOLEAN DEFAULT true,
        PRIMARY KEY (panel_id, method_id)
      )
    `);

    // ============ 3. SAMPLES ============
    await queryRunner.query(`
      CREATE TYPE sample_status AS ENUM ('draft', 'submitted', 'received', 'accessioned', 'preparing', 'testing', 'review', 'qa_review', 'approved', 'released', 'archived');
      CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
    `);

    await queryRunner.query(`
      CREATE TABLE sample_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id UUID REFERENCES organizations(id) NOT NULL,
        purchase_order VARCHAR(100),
        status sample_status NOT NULL DEFAULT 'draft',
        submitted_at TIMESTAMP,
        received_at TIMESTAMP,
        due_date DATE,
        created_by UUID REFERENCES users(id),
        qa_reviewer_id UUID REFERENCES users(id),
        notes TEXT,
        priority priority_level DEFAULT 'medium',
        is_urgent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE samples (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_code VARCHAR(100) UNIQUE NOT NULL,
        batch_id UUID REFERENCES sample_batches(id) ON DELETE CASCADE NOT NULL,
        product_id UUID REFERENCES products(id) NOT NULL,
        lot_number VARCHAR(100) NOT NULL,
        manufacturing_date DATE,
        expiration_date DATE,
        sample_type VARCHAR(50),
        sample_weight DECIMAL(10,4),
        sample_volume DECIMAL(10,4),
        unit VARCHAR(20),
        storage_condition VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        current_location VARCHAR(100),
        container_id VARCHAR(100),
        collected_by VARCHAR(100),
        collected_date DATE,
        received_by UUID REFERENCES users(id),
        received_date TIMESTAMP,
        result_summary TEXT,
        is_out_of_spec BOOLEAN DEFAULT false,
        is_retest BOOLEAN DEFAULT false,
        coa_generated BOOLEAN DEFAULT false,
        coa_url VARCHAR(500),
        qr_code_url VARCHAR(500),
        qr_code_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE sample_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id UUID REFERENCES samples(id) ON DELETE CASCADE NOT NULL,
        method_id UUID REFERENCES test_methods(id) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        instrument_id UUID,
        instrument_method_id UUID,
        result_value DECIMAL(20,6),
        result_unit VARCHAR(50),
        result_text TEXT,
        result_status VARCHAR(50),
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        test_order INT,
        notes TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 4. INSTRUMENTS ============
    await queryRunner.query(`
      CREATE TYPE instrument_type AS ENUM ('HPLC', 'UPLC', 'GC-MS', 'ICP-MS', 'FTIR', 'UV-Vis', 'endotoxin', 'sterility', 'pH_meter', 'osmometer');
      CREATE TYPE instrument_status AS ENUM ('operational', 'maintenance', 'calibration', 'offline', 'retired');
    `);

    await queryRunner.query(`
      CREATE TABLE instruments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        instrument_code VARCHAR(50) UNIQUE NOT NULL,
        type instrument_type NOT NULL,
        model VARCHAR(100),
        manufacturer VARCHAR(100),
        serial_number VARCHAR(100),
        status instrument_status DEFAULT 'operational',
        lab_location VARCHAR(100),
        room VARCHAR(50),
        bench_number VARCHAR(20),
        last_calibration_date DATE,
        next_calibration_date DATE,
        calibration_certificate_url VARCHAR(500),
        maintenance_schedule JSONB,
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        software_version VARCHAR(50),
        integration_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE instrument_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE NOT NULL,
        test_method_id UUID REFERENCES test_methods(id),
        method_description TEXT,
        parameters JSONB,
        method_file_url VARCHAR(500),
        method_file_hash VARCHAR(255),
        version VARCHAR(20),
        is_current BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        approved_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE instrument_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instrument_id UUID REFERENCES instruments(id) NOT NULL,
        instrument_method_id UUID REFERENCES instrument_methods(id),
        run_number VARCHAR(50) NOT NULL,
        sequence_number VARCHAR(50),
        operator_id UUID REFERENCES users(id) NOT NULL,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        raw_data_url VARCHAR(500),
        raw_data_hash VARCHAR(255),
        processed_data JSONB,
        notes TEXT,
        error_log TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE instrument_run_samples (
        run_id UUID REFERENCES instrument_runs(id) ON DELETE CASCADE NOT NULL,
        sample_test_id UUID REFERENCES sample_tests(id) ON DELETE CASCADE NOT NULL,
        injection_order INT,
        injection_volume DECIMAL(10,4),
        retention_time DECIMAL(10,2),
        PRIMARY KEY (run_id, sample_test_id)
      )
    `);

    // ============ 5. QUALITY & REVIEWS ============
    await queryRunner.query(`
      CREATE TYPE review_type AS ENUM ('analyst_review', 'qa_review');
      CREATE TYPE review_decision AS ENUM ('approved', 'rejected', 'needs_revision');
    `);

    await queryRunner.query(`
      CREATE TABLE quality_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id UUID REFERENCES samples(id) ON DELETE CASCADE NOT NULL,
        review_type review_type NOT NULL,
        reviewer_id UUID REFERENCES users(id) NOT NULL,
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decision review_decision NOT NULL,
        comments TEXT,
        signature_verified BOOLEAN DEFAULT false,
        signature_hash VARCHAR(255),
        signing_key_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE electronic_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        record_id UUID NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        sign_meaning VARCHAR(255) NOT NULL,
        signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        signature_hash VARCHAR(255) UNIQUE NOT NULL,
        step_up_verified BOOLEAN DEFAULT true,
        step_up_method VARCHAR(50),
        step_up_timestamp TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        location VARCHAR(255),
        bound_record_hash VARCHAR(255) NOT NULL,
        record_version INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 6. AUDIT TRAIL ============
    await queryRunner.query(`
      CREATE TABLE audit_trail (
        id BIGSERIAL PRIMARY KEY,
        event_id UUID NOT NULL DEFAULT gen_random_uuid(),
        request_id VARCHAR(100),
        user_id UUID REFERENCES users(id),
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        previous_hash VARCHAR(255),
        event_hash VARCHAR(255) UNIQUE NOT NULL,
        was_signed BOOLEAN DEFAULT false,
        signature_id UUID REFERENCES electronic_signatures(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_trail_resource ON audit_trail(resource_type, resource_id);
      CREATE INDEX idx_audit_trail_user ON audit_trail(user_id);
      CREATE INDEX idx_audit_trail_created ON audit_trail(created_at DESC);
    `);

    // ============ 7. COA ============
    await queryRunner.query(`
      CREATE TABLE coa_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        product_type VARCHAR(100),
        template_html TEXT NOT NULL,
        template_css TEXT,
        brand_color VARCHAR(7),
        logo_url VARCHAR(500),
        sections JSONB,
        custom_fields JSONB,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        version INT DEFAULT 1,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE coa_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coa_number VARCHAR(50) UNIQUE NOT NULL,
        sample_id UUID REFERENCES samples(id) NOT NULL,
        batch_id UUID REFERENCES sample_batches(id) NOT NULL,
        template_id UUID REFERENCES coa_templates(id),
        content JSONB NOT NULL,
        coa_hash VARCHAR(255) UNIQUE NOT NULL,
        previous_coa_hash VARCHAR(255),
        chain_position INT,
        qr_code_url VARCHAR(500),
        qr_code_hash VARCHAR(255),
        public_url VARCHAR(500),
        analyst_signature_id UUID REFERENCES electronic_signatures(id),
        qa_signature_id UUID REFERENCES electronic_signatures(id),
        released_at TIMESTAMP,
        expires_at DATE,
        version INT DEFAULT 1,
        superseded_by UUID REFERENCES coa_records(id),
        supersedes UUID REFERENCES coa_records(id),
        worm_locked BOOLEAN DEFAULT false,
        worm_lock_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 8. PUBLIC VERIFICATION ============
    await queryRunner.query(`
      CREATE TABLE verification_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coa_id UUID REFERENCES coa_records(id) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        manufacturer_name VARCHAR(255) NOT NULL,
        manufacturer_id UUID REFERENCES organizations(id),
        lot_number VARCHAR(100) NOT NULL,
        search_terms TSVECTOR,
        compound_names TEXT[],
        test_results JSONB,
        verification_status VARCHAR(50) NOT NULL DEFAULT 'verified',
        last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        public_url VARCHAR(500) NOT NULL,
        qr_code_url VARCHAR(500),
        qr_code_data TEXT,
        badge_asset_url VARCHAR(500),
        badge_hash VARCHAR(255),
        view_count INT DEFAULT 0,
        scan_count INT DEFAULT 0,
        download_count INT DEFAULT 0,
        opensearch_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_verification_search ON verification_records USING GIN(search_terms);
      CREATE INDEX idx_verification_lot ON verification_records(lot_number);
    `);

    // ============ 9. INVENTORY ============
    await queryRunner.query(`
      CREATE TABLE storage_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location_type VARCHAR(50) NOT NULL,
        temperature_range VARCHAR(50),
        capacity VARCHAR(50),
        parent_location_id UUID REFERENCES storage_locations(id),
        shelf VARCHAR(20),
        rack VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        is_occupied BOOLEAN DEFAULT false,
        current_usage_percent DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        item_code VARCHAR(50) UNIQUE NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        sub_category VARCHAR(100),
        manufacturer VARCHAR(255),
        catalog_number VARCHAR(100),
        lot_number VARCHAR(100),
        quantity DECIMAL(10,4) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        minimum_quantity DECIMAL(10,4),
        maximum_quantity DECIMAL(10,4),
        storage_location_id UUID REFERENCES storage_locations(id),
        bin_number VARCHAR(20),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        is_consumable BOOLEAN DEFAULT true,
        is_hazardous BOOLEAN DEFAULT false,
        msds_url VARCHAR(500),
        certificate_url VARCHAR(500),
        safety_data TEXT,
        expiry_date DATE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
        movement_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        from_location_id UUID REFERENCES storage_locations(id),
        to_location_id UUID REFERENCES storage_locations(id),
        reference_id UUID,
        reference_type VARCHAR(50),
        performed_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 10. BILLING ============
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        plan_tier VARCHAR(50) NOT NULL,
        billing_cycle VARCHAR(20) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        start_date DATE NOT NULL,
        end_date DATE,
        renewal_date DATE,
        trial_end_date DATE,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) NOT NULL,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        tax_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE,
        line_items JSONB NOT NULL,
        stripe_invoice_id VARCHAR(255),
        stripe_payment_intent_id VARCHAR(255),
        pdf_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id),
        organization_id UUID REFERENCES organizations(id) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50) NOT NULL,
        payment_provider VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255),
        provider_reference VARCHAR(255),
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 11. NOTIFICATIONS & MESSAGES ============
    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        action_url VARCHAR(500),
        action_text VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        read_at TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'normal',
        category VARCHAR(50),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        delivery_attempts INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE secure_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) NOT NULL,
        recipient_id UUID REFERENCES users(id) NOT NULL,
        organization_id UUID REFERENCES organizations(id),
        sample_id UUID REFERENCES samples(id),
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'unread',
        read_at TIMESTAMP,
        replied_at TIMESTAMP,
        parent_message_id UUID REFERENCES secure_messages(id),
        attachments JSONB,
        is_encrypted BOOLEAN DEFAULT true,
        encryption_key_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 12. WORKFLOW ============
    await queryRunner.query(`
      CREATE TABLE workflow_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_name VARCHAR(100) NOT NULL,
        state_name VARCHAR(50) NOT NULL,
        state_code VARCHAR(50) NOT NULL,
        allowed_roles JSONB,
        allowed_transitions JSONB,
        is_terminal BOOLEAN DEFAULT false,
        requires_esignature BOOLEAN DEFAULT false,
        requires_qa_review BOOLEAN DEFAULT false,
        display_name VARCHAR(100),
        display_color VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE workflow_transitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        record_id UUID NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        from_state VARCHAR(50) NOT NULL,
        to_state VARCHAR(50) NOT NULL,
        transition_name VARCHAR(100),
        user_id UUID REFERENCES users(id) NOT NULL,
        ip_address VARCHAR(45),
        justification TEXT,
        audit_event_id BIGINT REFERENCES audit_trail(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 13. API KEYS & INTEGRATION ============
    await queryRunner.query(`
      CREATE TABLE api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) NOT NULL,
        name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        hashed_key VARCHAR(255) NOT NULL,
        scopes JSONB NOT NULL,
        rate_limit_per_minute INT DEFAULT 60,
        rate_limit_per_hour INT DEFAULT 1000,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        ip_whitelist TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE api_logs (
        id BIGSERIAL PRIMARY KEY,
        api_key_id UUID REFERENCES api_keys(id),
        organization_id UUID REFERENCES organizations(id),
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        request_ip VARCHAR(45),
        status_code INT NOT NULL,
        response_time_ms INT,
        request_data JSONB,
        response_data JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============ 14. VERIFIED BADGES ============
    await queryRunner.query(`
      CREATE TABLE verified_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) NOT NULL,
        verification_record_id UUID REFERENCES verification_records(id),
        badge_code VARCHAR(50) UNIQUE NOT NULL,
        badge_url VARCHAR(500),
        badge_embed_code TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        valid_from DATE NOT NULL,
        valid_until DATE,
        view_count INT DEFAULT 0,
        click_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE consumer_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) NOT NULL,
        consumer_id UUID REFERENCES users(id),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        content TEXT,
        is_verified_purchase BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    const tables = [
      'consumer_reviews', 'verified_badges', 'api_logs', 'api_keys',
      'workflow_transitions', 'workflow_states', 'secure_messages',
      'notifications', 'payments', 'invoices', 'subscriptions',
      'inventory_movements', 'inventory_items', 'storage_locations',
      'verification_records', 'coa_records', 'coa_templates',
      'audit_trail', 'electronic_signatures', 'quality_reviews',
      'instrument_run_samples', 'instrument_runs', 'instrument_methods',
      'instruments', 'sample_tests', 'samples', 'sample_batches',
      'test_panel_methods', 'test_panels', 'test_methods', 'products',
      'user_sessions', 'users', 'organizations'
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    const types = [
      'instrument_status', 'instrument_type', 'review_decision',
      'review_type', 'priority_level', 'sample_status',
      'user_role', 'subscription_tier', 'org_type'
    ];

    for (const type of types) {
      await queryRunner.query(`DROP TYPE IF EXISTS ${type} CASCADE`);
    }
  }
}