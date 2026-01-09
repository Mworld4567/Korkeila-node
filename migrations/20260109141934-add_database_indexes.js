'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ==================== ADMINS TABLE ====================
    // Index for username (used for login)
    await queryInterface.addIndex('admins', ['username'], {
      name: 'idx_admins_username',
      unique: false
    });
    
    // Index for email (used for login and lookups)
    await queryInterface.addIndex('admins', ['email'], {
      name: 'idx_admins_email',
      unique: false
    });
    
    // Index for role_id (foreign key)
    await queryInterface.addIndex('admins', ['role_id'], {
      name: 'idx_admins_role_id'
    });
    
    // Index for status (filtering)
    await queryInterface.addIndex('admins', ['status'], {
      name: 'idx_admins_status'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('admins', ['deleted_at'], {
      name: 'idx_admins_deleted_at'
    });

    // ==================== ADMIN_LOGS TABLE ====================
    // Index for admin_id (foreign key)
    await queryInterface.addIndex('admin_logs', ['admin_id'], {
      name: 'idx_admin_logs_admin_id'
    });
    
    // Index for action_module (filtering)
    await queryInterface.addIndex('admin_logs', ['action_module'], {
      name: 'idx_admin_logs_action_module'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('admin_logs', ['deleted_at'], {
      name: 'idx_admin_logs_deleted_at'
    });
    
    // Composite index for admin_id and deleted_at (common query pattern)
    await queryInterface.addIndex('admin_logs', ['admin_id', 'deleted_at'], {
      name: 'idx_admin_logs_admin_id_deleted_at'
    });

    // ==================== APPOINTMENTS TABLE ====================
    // Index for email (searching)
    await queryInterface.addIndex('appointments', ['email'], {
      name: 'idx_appointments_email'
    });
    
    // Index for date (filtering by date)
    await queryInterface.addIndex('appointments', ['date'], {
      name: 'idx_appointments_date'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('appointments', ['deleted_at'], {
      name: 'idx_appointments_deleted_at'
    });

    // ==================== CATEGORIES TABLE ====================
    // Index for category_code (lookup)
    await queryInterface.addIndex('categories', ['category_code'], {
      name: 'idx_categories_category_code',
      unique: false
    });
    
    // Index for category_name (searching)
    await queryInterface.addIndex('categories', ['category_name'], {
      name: 'idx_categories_category_name'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('categories', ['deleted_at'], {
      name: 'idx_categories_deleted_at'
    });

    // ==================== CATEGORY_TRANSLATIONS TABLE ====================
    // Composite unique index for category_id and language_id (unique constraint)
    await queryInterface.addIndex('category_translations', ['category_id', 'language_id'], {
      name: 'idx_category_translations_category_language',
      unique: true
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('category_translations', ['language_id'], {
      name: 'idx_category_translations_language_id'
    });
    
    // Index for category_name (searching)
    await queryInterface.addIndex('category_translations', ['category_name'], {
      name: 'idx_category_translations_category_name'
    });

    // ==================== SUB_CATEGORIES TABLE ====================
    // Index for category_id (foreign key)
    await queryInterface.addIndex('sub_categories', ['category_id'], {
      name: 'idx_sub_categories_category_id'
    });
    
    // Index for sub_category_code (lookup)
    await queryInterface.addIndex('sub_categories', ['sub_category_code'], {
      name: 'idx_sub_categories_sub_category_code'
    });
    
    // Index for sub_category_name (searching)
    await queryInterface.addIndex('sub_categories', ['sub_category_name'], {
      name: 'idx_sub_categories_sub_category_name'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('sub_categories', ['deleted_at'], {
      name: 'idx_sub_categories_deleted_at'
    });

    // ==================== PRODUCTS TABLE ====================
    // Index for category_id (foreign key)
    await queryInterface.addIndex('products', ['category_id'], {
      name: 'idx_products_category_id'
    });
    
    // Index for sub_category_id (foreign key)
    await queryInterface.addIndex('products', ['sub_category_id'], {
      name: 'idx_products_sub_category_id'
    });
    
    // Index for style_id (foreign key)
    await queryInterface.addIndex('products', ['style_id'], {
      name: 'idx_products_style_id'
    });
    
    // Index for is_display (filtering)
    await queryInterface.addIndex('products', ['is_display'], {
      name: 'idx_products_is_display'
    });
    
    // Composite index for category, sub_category, and display status (common query pattern)
    await queryInterface.addIndex('products', ['category_id', 'sub_category_id', 'is_display'], {
      name: 'idx_products_category_subcategory_display'
    });

    // ==================== PRODUCT_TRANSLATIONS TABLE ====================
    // Composite unique index for product_id and language_id (unique constraint)
    await queryInterface.addIndex('product_translations', ['product_id', 'language_id'], {
      name: 'idx_product_translations_product_language',
      unique: true
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('product_translations', ['language_id'], {
      name: 'idx_product_translations_language_id'
    });
    
    // Index for product_name (searching)
    await queryInterface.addIndex('product_translations', ['product_name'], {
      name: 'idx_product_translations_product_name'
    });

    // ==================== DESIGNS TABLE ====================
    // Index for product_id (foreign key - frequently used)
    await queryInterface.addIndex('designs', ['product_id'], {
      name: 'idx_designs_product_id'
    });
    
    // Index for category_id (foreign key)
    await queryInterface.addIndex('designs', ['category_id'], {
      name: 'idx_designs_category_id'
    });
    
    // Index for sub_category_id (foreign key)
    await queryInterface.addIndex('designs', ['sub_category_id'], {
      name: 'idx_designs_sub_category_id'
    });
    
    // Index for metal_rate_id (foreign key - frequently used)
    await queryInterface.addIndex('designs', ['metal_rate_id'], {
      name: 'idx_designs_metal_rate_id'
    });
    
    // Index for design_variant_name (searching with LIKE)
    await queryInterface.addIndex('designs', ['design_variant_name'], {
      name: 'idx_designs_design_variant_name'
    });
    
    // Index for sku_number (lookup)
    await queryInterface.addIndex('designs', ['sku_number'], {
      name: 'idx_designs_sku_number',
      unique: false
    });
    
    // Index for is_filter_available (filtering)
    await queryInterface.addIndex('designs', ['is_filter_available'], {
      name: 'idx_designs_is_filter_available'
    });
    
    // Index for price_flag (filtering)
    await queryInterface.addIndex('designs', ['price_flag'], {
      name: 'idx_designs_price_flag'
    });
    
    // Index for metal_weight (searching/filtering)
    await queryInterface.addIndex('designs', ['metal_weight'], {
      name: 'idx_designs_metal_weight'
    });
    
    // Composite index for product_id and filter status (common query pattern)
    await queryInterface.addIndex('designs', ['product_id', 'is_filter_available'], {
      name: 'idx_designs_product_filter'
    });

    // ==================== DESIGN_TRANSLATIONS TABLE ====================
    // Composite unique index for design_id and language_id (unique constraint)
    await queryInterface.addIndex('design_translations', ['design_id', 'language_id'], {
      name: 'idx_design_translations_design_language',
      unique: true
    });
    
    // Index for design_id (foreign key)
    await queryInterface.addIndex('design_translations', ['design_id'], {
      name: 'idx_design_translations_design_id'
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('design_translations', ['language_id'], {
      name: 'idx_design_translations_language_id'
    });
    
    // Index for design_variant_name (searching with LIKE)
    await queryInterface.addIndex('design_translations', ['design_variant_name'], {
      name: 'idx_design_translations_design_variant_name'
    });
    
    // Composite index for language_id and design_variant_name (common search pattern)
    await queryInterface.addIndex('design_translations', ['language_id', 'design_variant_name'], {
      name: 'idx_design_translations_language_name'
    });

    // ==================== DESIGNS_IMAGES TABLE ====================
    // Index for design_id (foreign key)
    await queryInterface.addIndex('designs_images', ['design_id'], {
      name: 'idx_designs_images_design_id'
    });
    
    // Index for order (sorting)
    await queryInterface.addIndex('designs_images', ['order'], {
      name: 'idx_designs_images_order'
    });
    
    // Index for is_product_listing (filtering)
    await queryInterface.addIndex('designs_images', ['is_product_listing'], {
      name: 'idx_designs_images_is_product_listing'
    });
    
    // Composite index for design_id and order (common query pattern for sorted images)
    await queryInterface.addIndex('designs_images', ['design_id', 'order'], {
      name: 'idx_designs_images_design_order'
    });

    // ==================== DESIGNS_DIAMOND_DETAILS TABLE ====================
    // Index for design_id (foreign key - frequently used)
    await queryInterface.addIndex('designs_diamond_details', ['design_id'], {
      name: 'idx_designs_diamond_details_design_id'
    });
    
    // Index for cut_master_id (foreign key)
    await queryInterface.addIndex('designs_diamond_details', ['cut_master_id'], {
      name: 'idx_designs_diamond_details_cut_master_id'
    });
    
    // Index for diamond_rate_id (foreign key)
    await queryInterface.addIndex('designs_diamond_details', ['diamond_rate_id'], {
      name: 'idx_designs_diamond_details_diamond_rate_id'
    });
    
    // Index for is_center (filtering)
    await queryInterface.addIndex('designs_diamond_details', ['is_center'], {
      name: 'idx_designs_diamond_details_is_center'
    });
    
    // Index for position_visible (filtering)
    await queryInterface.addIndex('designs_diamond_details', ['position_visible'], {
      name: 'idx_designs_diamond_details_position_visible'
    });

    // ==================== METALS TABLE ====================
    // Index for metal_name (searching)
    await queryInterface.addIndex('metals', ['metal_name'], {
      name: 'idx_metals_metal_name'
    });
    
    // Index for metal_code (lookup)
    await queryInterface.addIndex('metals', ['metal_code'], {
      name: 'idx_metals_metal_code'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('metals', ['deleted_at'], {
      name: 'idx_metals_deleted_at'
    });

    // ==================== METAL_RATE_MASTERS TABLE ====================
    // Index for metal_id (foreign key - frequently used)
    await queryInterface.addIndex('metal_rate_masters', ['metal_id'], {
      name: 'idx_metal_rate_masters_metal_id'
    });
    
    // Index for karat_id (foreign key)
    await queryInterface.addIndex('metal_rate_masters', ['karat_id'], {
      name: 'idx_metal_rate_masters_karat_id'
    });
    
    // Index for date (filtering by date)
    await queryInterface.addIndex('metal_rate_masters', ['date'], {
      name: 'idx_metal_rate_masters_date'
    });
    
    // Composite unique index for metal_id, karat_id, and date (unique constraint)
    await queryInterface.addIndex('metal_rate_masters', ['metal_id', 'karat_id', 'date'], {
      name: 'idx_metal_rate_masters_metal_karat_date',
      unique: true
    });
    
    // Composite index for metal_id and karat_id (common query pattern)
    await queryInterface.addIndex('metal_rate_masters', ['metal_id', 'karat_id'], {
      name: 'idx_metal_rate_masters_metal_karat'
    });

    // ==================== KARATS TABLE ====================
    // Index for karat (searching)
    await queryInterface.addIndex('karats', ['karat'], {
      name: 'idx_karats_karat'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('karats', ['deleted_at'], {
      name: 'idx_karats_deleted_at'
    });

    // ==================== DIAMOND_MASTERS TABLE ====================
    // Index for carat (searching/filtering)
    await queryInterface.addIndex('diamond_masters', ['carat'], {
      name: 'idx_diamond_masters_carat'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('diamond_masters', ['deleted_at'], {
      name: 'idx_diamond_masters_deleted_at'
    });

    // ==================== DIAMOND_RATES TABLE ====================
    // Index for diamond_master_id (foreign key)
    await queryInterface.addIndex('diamond_rates', ['diamond_master_id'], {
      name: 'idx_diamond_rates_diamond_master_id'
    });
    
    // Index for diamond_type_id (foreign key)
    await queryInterface.addIndex('diamond_rates', ['diamond_type_id'], {
      name: 'idx_diamond_rates_diamond_type_id'
    });
    
    // Index for clarity_id (foreign key)
    await queryInterface.addIndex('diamond_rates', ['clarity_id'], {
      name: 'idx_diamond_rates_clarity_id'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('diamond_rates', ['deleted_at'], {
      name: 'idx_diamond_rates_deleted_at'
    });
    
    // Composite index for diamond_master_id, diamond_type_id, and clarity_id (common query pattern)
    await queryInterface.addIndex('diamond_rates', ['diamond_master_id', 'diamond_type_id', 'clarity_id'], {
      name: 'idx_diamond_rates_master_type_clarity'
    });

    // ==================== DIAMOND_TYPES TABLE ====================
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('diamond_types', ['deleted_at'], {
      name: 'idx_diamond_types_deleted_at'
    });

    // ==================== DIAMOND_TYPE_TRANSLATIONS TABLE ====================
    // Composite unique index for diamond_type_id and language_id (unique constraint)
    await queryInterface.addIndex('diamond_type_translations', ['diamond_type_id', 'language_id'], {
      name: 'idx_diamond_type_translations_type_language',
      unique: true
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('diamond_type_translations', ['language_id'], {
      name: 'idx_diamond_type_translations_language_id'
    });

    // ==================== DIAMOND_CLARITIES TABLE ====================
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('diamond_clarities', ['deleted_at'], {
      name: 'idx_diamond_clarities_deleted_at'
    });

    // ==================== CUT_MASTERS TABLE ====================
    // Index for cut_name (searching)
    await queryInterface.addIndex('cut_masters', ['cut_name'], {
      name: 'idx_cut_masters_cut_name'
    });
    
    // Index for cut_code (lookup)
    await queryInterface.addIndex('cut_masters', ['cut_code'], {
      name: 'idx_cut_masters_cut_code'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('cut_masters', ['deleted_at'], {
      name: 'idx_cut_masters_deleted_at'
    });

    // ==================== STYLE_MASTERS TABLE ====================
    // Index for category_id (foreign key)
    await queryInterface.addIndex('style_masters', ['category_id'], {
      name: 'idx_style_masters_category_id'
    });
    
    // Index for sub_category_id (foreign key)
    await queryInterface.addIndex('style_masters', ['sub_category_id'], {
      name: 'idx_style_masters_sub_category_id'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('style_masters', ['deleted_at'], {
      name: 'idx_style_masters_deleted_at'
    });

    // ==================== METAL_TRANSLATIONS TABLE ====================
    // Composite unique index for metal_id and language_id (unique constraint)
    await queryInterface.addIndex('metal_translations', ['metal_id', 'language_id'], {
      name: 'idx_metal_translations_metal_language',
      unique: true
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('metal_translations', ['language_id'], {
      name: 'idx_metal_translations_language_id'
    });

    // ==================== UI_STRINGS TABLE ====================
    // Index for string_key (lookup)
    await queryInterface.addIndex('ui_strings', ['string_key'], {
      name: 'idx_ui_strings_string_key',
      unique: false
    });

    // ==================== UI_STRING_TRANSLATIONS TABLE ====================
    // Composite unique index for ui_string_id and language_id (unique constraint)
    await queryInterface.addIndex('ui_string_translations', ['ui_string_id', 'language_id'], {
      name: 'idx_ui_string_translations_string_language',
      unique: true
    });
    
    // Index for language_id (foreign key)
    await queryInterface.addIndex('ui_string_translations', ['language_id'], {
      name: 'idx_ui_string_translations_language_id'
    });

    // ==================== ADMIN_ROLES TABLE ====================
    // Index for role_name (searching)
    await queryInterface.addIndex('admin_roles', ['role_name'], {
      name: 'idx_admin_roles_role_name'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('admin_roles', ['deleted_at'], {
      name: 'idx_admin_roles_deleted_at'
    });

    // ==================== PERMISSIONS TABLE ====================
    // Index for name (searching)
    await queryInterface.addIndex('permissions', ['name'], {
      name: 'idx_permissions_name'
    });
    
    // Index for type (filtering)
    await queryInterface.addIndex('permissions', ['type'], {
      name: 'idx_permissions_type'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('permissions', ['deleted_at'], {
      name: 'idx_permissions_deleted_at'
    });

    // ==================== ROLE_PERMISSIONS TABLE ====================
    // Index for role_id (foreign key)
    await queryInterface.addIndex('role_permissions', ['role_id'], {
      name: 'idx_role_permissions_role_id'
    });
    
    // Index for permission_id (foreign key)
    await queryInterface.addIndex('role_permissions', ['permission_id'], {
      name: 'idx_role_permissions_permission_id'
    });
    
    // Index for deleted_at (soft delete filtering)
    await queryInterface.addIndex('role_permissions', ['deleted_at'], {
      name: 'idx_role_permissions_deleted_at'
    });
    
    // Composite index for role_id and permission_id (common query pattern)
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
      name: 'idx_role_permissions_role_permission'
    });

    // ==================== LANGUAGES TABLE ====================
    // Index for language_code (lookup)
    await queryInterface.addIndex('languages', ['language_code'], {
      name: 'idx_languages_language_code',
      unique: false
    });
    
    // Index for language_name (searching)
    await queryInterface.addIndex('languages', ['language_name'], {
      name: 'idx_languages_language_name'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all indexes in reverse order
    
    // UI String Translations
    await queryInterface.removeIndex('ui_string_translations', 'idx_ui_string_translations_language_id');
    await queryInterface.removeIndex('ui_string_translations', 'idx_ui_string_translations_string_language');
    
    // UI Strings
    await queryInterface.removeIndex('ui_strings', 'idx_ui_strings_string_key');
    
    // Metal Translations
    await queryInterface.removeIndex('metal_translations', 'idx_metal_translations_language_id');
    await queryInterface.removeIndex('metal_translations', 'idx_metal_translations_metal_language');
    
    // Style Masters
    await queryInterface.removeIndex('style_masters', 'idx_style_masters_deleted_at');
    await queryInterface.removeIndex('style_masters', 'idx_style_masters_sub_category_id');
    await queryInterface.removeIndex('style_masters', 'idx_style_masters_category_id');
    
    // Cut Masters
    await queryInterface.removeIndex('cut_masters', 'idx_cut_masters_deleted_at');
    await queryInterface.removeIndex('cut_masters', 'idx_cut_masters_cut_code');
    await queryInterface.removeIndex('cut_masters', 'idx_cut_masters_cut_name');
    
    // Diamond Clarities
    await queryInterface.removeIndex('diamond_clarities', 'idx_diamond_clarities_deleted_at');
    
    // Diamond Type Translations
    await queryInterface.removeIndex('diamond_type_translations', 'idx_diamond_type_translations_language_id');
    await queryInterface.removeIndex('diamond_type_translations', 'idx_diamond_type_translations_type_language');
    
    // Diamond Types
    await queryInterface.removeIndex('diamond_types', 'idx_diamond_types_deleted_at');
    
    // Diamond Rates
    await queryInterface.removeIndex('diamond_rates', 'idx_diamond_rates_master_type_clarity');
    await queryInterface.removeIndex('diamond_rates', 'idx_diamond_rates_deleted_at');
    await queryInterface.removeIndex('diamond_rates', 'idx_diamond_rates_clarity_id');
    await queryInterface.removeIndex('diamond_rates', 'idx_diamond_rates_diamond_type_id');
    await queryInterface.removeIndex('diamond_rates', 'idx_diamond_rates_diamond_master_id');
    
    // Diamond Masters
    await queryInterface.removeIndex('diamond_masters', 'idx_diamond_masters_deleted_at');
    await queryInterface.removeIndex('diamond_masters', 'idx_diamond_masters_carat');
    
    // Karats
    await queryInterface.removeIndex('karats', 'idx_karats_deleted_at');
    await queryInterface.removeIndex('karats', 'idx_karats_karat');
    
    // Metal Rate Masters
    await queryInterface.removeIndex('metal_rate_masters', 'idx_metal_rate_masters_metal_karat');
    await queryInterface.removeIndex('metal_rate_masters', 'idx_metal_rate_masters_metal_karat_date');
    await queryInterface.removeIndex('metal_rate_masters', 'idx_metal_rate_masters_date');
    await queryInterface.removeIndex('metal_rate_masters', 'idx_metal_rate_masters_karat_id');
    await queryInterface.removeIndex('metal_rate_masters', 'idx_metal_rate_masters_metal_id');
    
    // Metals
    await queryInterface.removeIndex('metals', 'idx_metals_deleted_at');
    await queryInterface.removeIndex('metals', 'idx_metals_metal_code');
    await queryInterface.removeIndex('metals', 'idx_metals_metal_name');
    
    // Designs Diamond Details
    await queryInterface.removeIndex('designs_diamond_details', 'idx_designs_diamond_details_position_visible');
    await queryInterface.removeIndex('designs_diamond_details', 'idx_designs_diamond_details_is_center');
    await queryInterface.removeIndex('designs_diamond_details', 'idx_designs_diamond_details_diamond_rate_id');
    await queryInterface.removeIndex('designs_diamond_details', 'idx_designs_diamond_details_cut_master_id');
    await queryInterface.removeIndex('designs_diamond_details', 'idx_designs_diamond_details_design_id');
    
    // Designs Images
    await queryInterface.removeIndex('designs_images', 'idx_designs_images_design_order');
    await queryInterface.removeIndex('designs_images', 'idx_designs_images_is_product_listing');
    await queryInterface.removeIndex('designs_images', 'idx_designs_images_order');
    await queryInterface.removeIndex('designs_images', 'idx_designs_images_design_id');
    
    // Design Translations
    await queryInterface.removeIndex('design_translations', 'idx_design_translations_language_name');
    await queryInterface.removeIndex('design_translations', 'idx_design_translations_design_variant_name');
    await queryInterface.removeIndex('design_translations', 'idx_design_translations_language_id');
    await queryInterface.removeIndex('design_translations', 'idx_design_translations_design_id');
    await queryInterface.removeIndex('design_translations', 'idx_design_translations_design_language');
    
    // Designs
    await queryInterface.removeIndex('designs', 'idx_designs_product_filter');
    await queryInterface.removeIndex('designs', 'idx_designs_metal_weight');
    await queryInterface.removeIndex('designs', 'idx_designs_price_flag');
    await queryInterface.removeIndex('designs', 'idx_designs_is_filter_available');
    await queryInterface.removeIndex('designs', 'idx_designs_sku_number');
    await queryInterface.removeIndex('designs', 'idx_designs_design_variant_name');
    await queryInterface.removeIndex('designs', 'idx_designs_metal_rate_id');
    await queryInterface.removeIndex('designs', 'idx_designs_sub_category_id');
    await queryInterface.removeIndex('designs', 'idx_designs_category_id');
    await queryInterface.removeIndex('designs', 'idx_designs_product_id');
    
    // Product Translations
    await queryInterface.removeIndex('product_translations', 'idx_product_translations_product_name');
    await queryInterface.removeIndex('product_translations', 'idx_product_translations_language_id');
    await queryInterface.removeIndex('product_translations', 'idx_product_translations_product_language');
    
    // Products
    await queryInterface.removeIndex('products', 'idx_products_category_subcategory_display');
    await queryInterface.removeIndex('products', 'idx_products_is_display');
    await queryInterface.removeIndex('products', 'idx_products_style_id');
    await queryInterface.removeIndex('products', 'idx_products_sub_category_id');
    await queryInterface.removeIndex('products', 'idx_products_category_id');
    
    // Sub Categories
    await queryInterface.removeIndex('sub_categories', 'idx_sub_categories_deleted_at');
    await queryInterface.removeIndex('sub_categories', 'idx_sub_categories_sub_category_name');
    await queryInterface.removeIndex('sub_categories', 'idx_sub_categories_sub_category_code');
    await queryInterface.removeIndex('sub_categories', 'idx_sub_categories_category_id');
    
    // Category Translations
    await queryInterface.removeIndex('category_translations', 'idx_category_translations_category_name');
    await queryInterface.removeIndex('category_translations', 'idx_category_translations_language_id');
    await queryInterface.removeIndex('category_translations', 'idx_category_translations_category_language');
    
    // Categories
    await queryInterface.removeIndex('categories', 'idx_categories_deleted_at');
    await queryInterface.removeIndex('categories', 'idx_categories_category_name');
    await queryInterface.removeIndex('categories', 'idx_categories_category_code');
    
    // Appointments
    await queryInterface.removeIndex('appointments', 'idx_appointments_deleted_at');
    await queryInterface.removeIndex('appointments', 'idx_appointments_date');
    await queryInterface.removeIndex('appointments', 'idx_appointments_email');
    
    // Admin Logs
    await queryInterface.removeIndex('admin_logs', 'idx_admin_logs_admin_id_deleted_at');
    await queryInterface.removeIndex('admin_logs', 'idx_admin_logs_deleted_at');
    await queryInterface.removeIndex('admin_logs', 'idx_admin_logs_action_module');
    await queryInterface.removeIndex('admin_logs', 'idx_admin_logs_admin_id');
    
    // Admins
    await queryInterface.removeIndex('admins', 'idx_admins_deleted_at');
    await queryInterface.removeIndex('admins', 'idx_admins_status');
    await queryInterface.removeIndex('admins', 'idx_admins_role_id');
    await queryInterface.removeIndex('admins', 'idx_admins_email');
    await queryInterface.removeIndex('admins', 'idx_admins_username');
    
    // Languages
    await queryInterface.removeIndex('languages', 'idx_languages_language_name');
    await queryInterface.removeIndex('languages', 'idx_languages_language_code');
    
    // Role Permissions
    await queryInterface.removeIndex('role_permissions', 'idx_role_permissions_role_permission');
    await queryInterface.removeIndex('role_permissions', 'idx_role_permissions_deleted_at');
    await queryInterface.removeIndex('role_permissions', 'idx_role_permissions_permission_id');
    await queryInterface.removeIndex('role_permissions', 'idx_role_permissions_role_id');
    
    // Permissions
    await queryInterface.removeIndex('permissions', 'idx_permissions_deleted_at');
    await queryInterface.removeIndex('permissions', 'idx_permissions_type');
    await queryInterface.removeIndex('permissions', 'idx_permissions_name');
    
    // Admin Roles
    await queryInterface.removeIndex('admin_roles', 'idx_admin_roles_deleted_at');
    await queryInterface.removeIndex('admin_roles', 'idx_admin_roles_role_name');
  }
};
