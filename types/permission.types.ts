/**
 * Reactory Knowledge Base - Permission Type Definitions
 * 
 * This file contains types for access control, permissions,
 * and security-related functionality.
 */

import { ObjectId } from 'mongoose';
import { KBVisibility, KBPermissionLevel } from './kb.types';

/**
 * Permission grant record
 */
export interface IPermissionGrant {
  id: string;
  contentId: string | ObjectId;
  subjectType: 'user' | 'role' | 'organization' | 'team';
  subjectId: string | ObjectId;
  permission: KBPermissionLevel;
  grantedBy: string | ObjectId;
  grantedAt: Date;
  expiresAt?: Date;
  inherited?: boolean; // Inherited from parent content
  metadata?: Record<string, any>;
}

/**
 * Permission check result
 */
export interface IPermissionCheckResult {
  allowed: boolean;
  permission?: KBPermissionLevel;
  reason?: string;
  inheritedFrom?: string; // Content ID if inherited
}

/**
 * Permission policy
 * Defines rules for access control
 */
export interface IPermissionPolicy {
  id: string;
  name: string;
  description?: string;
  rules: IPermissionRule[];
  priority: number;
  enabled: boolean;
  createdBy: string | ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission rule
 */
export interface IPermissionRule {
  id: string;
  condition: IPermissionCondition;
  effect: 'allow' | 'deny';
  permissions: KBPermissionLevel[];
  priority: number;
}

/**
 * Permission condition
 */
export interface IPermissionCondition {
  type: 'user' | 'role' | 'attribute' | 'time' | 'location' | 'custom';
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'matches' | 'custom';
  value: any;
  metadata?: Record<string, any>;
}

/**
 * Visibility settings for content
 */
export interface IVisibilitySettings {
  contentId: string | ObjectId;
  visibility: KBVisibility;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedOrganizations?: string[];
  restrictedUsers?: string[];
  publicAfter?: Date; // Make public after date
  publicUntil?: Date; // Make private after date
  inheritVisibility?: boolean; // Inherit from parent/KB
}

/**
 * Access request
 * When a user requests access to restricted content
 */
export interface IAccessRequest {
  id: string;
  contentId: string | ObjectId;
  requestedBy: string | ObjectId;
  requestedPermission: KBPermissionLevel;
  reason?: string;
  status: AccessRequestStatus;
  requestedAt: Date;
  reviewedBy?: string | ObjectId;
  reviewedAt?: Date;
  response?: string;
  expiresAt?: Date; // When the granted access expires
}

/**
 * Access request status
 */
export enum AccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Sharing link
 * Generate shareable links with specific permissions
 */
export interface ISharingLink {
  id: string;
  contentId: string | ObjectId;
  token: string; // Unique token for the link
  permission: KBPermissionLevel;
  createdBy: string | ObjectId;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  enabled: boolean;
  requiresAuth?: boolean;
  password?: string; // Optional password protection
  allowedDomains?: string[]; // Email domain restrictions
  metadata?: Record<string, any>;
}

/**
 * Permission audit log entry
 */
export interface IPermissionAuditLog {
  id: string;
  action: PermissionAuditAction;
  contentId?: string | ObjectId;
  subjectType: 'user' | 'role' | 'organization';
  subjectId: string | ObjectId;
  performedBy: string | ObjectId;
  permission?: KBPermissionLevel;
  previousPermission?: KBPermissionLevel;
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Permission audit actions
 */
export enum PermissionAuditAction {
  GRANT = 'grant',
  REVOKE = 'revoke',
  UPDATE = 'update',
  CHECK = 'check',
  DENY = 'deny',
  REQUEST = 'request',
  SHARE = 'share',
}

/**
 * Role definition
 */
export interface IKBRole {
  id: string;
  name: string;
  description?: string;
  permissions: KBPermissionLevel[];
  canGrant?: KBPermissionLevel[]; // Permissions this role can grant
  inheritsFrom?: string[]; // Other role IDs to inherit from
  system?: boolean; // System-defined role (cannot be modified)
  metadata?: Record<string, any>;
}

/**
 * User permission summary
 */
export interface IUserPermissionSummary {
  userId: string | ObjectId;
  contentPermissions: Array<{
    contentId: string;
    permission: KBPermissionLevel;
    inherited: boolean;
  }>;
  roles: string[];
  effectivePermissions: KBPermissionLevel[];
  lastUpdated: Date;
}

/**
 * Permission inheritance settings
 */
export interface IPermissionInheritance {
  contentId: string | ObjectId;
  inheritFromParent: boolean;
  inheritFromKB: boolean;
  overrideParent?: boolean; // Override parent permissions
  customRules?: IPermissionRule[];
}

/**
 * Bulk permission operation
 */
export interface IBulkPermissionOperation {
  operation: 'grant' | 'revoke' | 'update';
  contentIds: string[];
  subjects: Array<{
    type: 'user' | 'role' | 'organization';
    id: string;
  }>;
  permission: KBPermissionLevel;
  metadata?: Record<string, any>;
}

/**
 * Bulk permission result
 */
export interface IBulkPermissionResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    contentId: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Permission template
 * Pre-defined permission sets
 */
export interface IPermissionTemplate {
  id: string;
  name: string;
  description?: string;
  permissions: Array<{
    subjectType: 'user' | 'role';
    permission: KBPermissionLevel;
  }>;
  visibility: KBVisibility;
  metadata?: Record<string, any>;
}

/**
 * Content access statistics
 */
export interface IContentAccessStats {
  contentId: string;
  totalAccesses: number;
  uniqueUsers: number;
  accessesByPermission: Record<KBPermissionLevel, number>;
  accessesByRole: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
  topUsers: Array<{
    userId: string;
    accessCount: number;
    lastAccess: Date;
  }>;
}

/**
 * Export all types
 */
export type PermissionGrant = IPermissionGrant;
export type PermissionCheckResult = IPermissionCheckResult;
export type PermissionPolicy = IPermissionPolicy;
export type PermissionRule = IPermissionRule;
export type PermissionCondition = IPermissionCondition;
export type VisibilitySettings = IVisibilitySettings;
export type AccessRequest = IAccessRequest;
export type SharingLink = ISharingLink;
export type PermissionAuditLog = IPermissionAuditLog;
export type KBRole = IKBRole;
export type UserPermissionSummary = IUserPermissionSummary;
export type PermissionInheritance = IPermissionInheritance;
export type BulkPermissionOperation = IBulkPermissionOperation;
export type BulkPermissionResult = IBulkPermissionResult;
export type PermissionTemplate = IPermissionTemplate;
export type ContentAccessStats = IContentAccessStats;

