export enum UserRole {
  ANALYST = 'analyst',
  QA = 'qa',
  LAB_ADMIN = 'lab_admin',
  CUSTOMER = 'customer',
  MANUFACTURER = 'manufacturer',
  CONSUMER = 'consumer',
  SUPER_ADMIN = 'super_admin',
}

export enum OrgType {
  CUSTOMER = 'customer',
  MANUFACTURER = 'manufacturer',
  LAB = 'lab',
  PARTNER = 'partner',
}

export enum SampleStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  RECEIVED = 'received',
  ACCESSIONED = 'accessioned',
  PREPARING = 'preparing',
  TESTING = 'testing',
  REVIEW = 'review',
  QA_REVIEW = 'qa_review',
  APPROVED = 'approved',
  RELEASED = 'released',
  ARCHIVED = 'archived',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ReviewType {
  ANALYST_REVIEW = 'analyst_review',
  QA_REVIEW = 'qa_review',
}

export enum ReviewDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
}

export enum InstrumentType {
  HPLC = 'HPLC',
  UPLC = 'UPLC',
  GC_MS = 'GC-MS',
  ICP_MS = 'ICP-MS',
  FTIR = 'FTIR',
  UV_VIS = 'UV-Vis',
  ENDOTOXIN = 'endotoxin',
  STERILITY = 'sterility',
  PH_METER = 'pH_meter',
  OSMOMETER = 'osmometer',
}

export enum InstrumentStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  CALIBRATION = 'calibration',
  OFFLINE = 'offline',
  RETIRED = 'retired',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SIGN = 'SIGN',
  RELEASE = 'RELEASE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  TRANSITION = 'TRANSITION',
}

export enum SubscriptionTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}