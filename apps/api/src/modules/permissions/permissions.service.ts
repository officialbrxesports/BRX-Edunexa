import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { FEATURE_CATALOG } from './config/feature-catalog';
import {
  ROLE_FEATURE_MAP,
  RoleKey,
} from './config/role-feature-map';

const INSTITUTION_FEATURES: Record<
  string,
  readonly string[]
> = {
  SCHOOL: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'parents',
    'classes',
    'sections',
    'subjects',
    'attendance',
    'fees',
    'exams',
    'results',
    'homework',
    'assignments',
    'study-material',
    'timetable',
    'library',
    'transport',
    'certificates',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],

  COLLEGE: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'parents',
    'departments',
    'courses',
    'programs',
    'semesters',
    'subjects',
    'batches',
    'attendance',
    'fees',
    'exams',
    'results',
    'assignments',
    'study-material',
    'timetable',
    'library',
    'hostel',
    'transport',
    'certificates',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],

  UNIVERSITY: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'departments',
    'courses',
    'programs',
    'semesters',
    'subjects',
    'batches',
    'attendance',
    'fees',
    'exams',
    'results',
    'assignments',
    'study-material',
    'timetable',
    'library',
    'hostel',
    'transport',
    'certificates',
    'research',
    'thesis',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],

  COACHING: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'courses',
    'subjects',
    'batches',
    'attendance',
    'fees',
    'exams',
    'results',
    'homework',
    'assignments',
    'study-material',
    'timetable',
    'certificates',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],

  INSTITUTE: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'courses',
    'departments',
    'subjects',
    'batches',
    'attendance',
    'fees',
    'exams',
    'results',
    'study-material',
    'assignments',
    'timetable',
    'certificates',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],

  OTHER: [
    'dashboard',
    'students',
    'teachers',
    'staff',
    'courses',
    'subjects',
    'batches',
    'attendance',
    'fees',
    'exams',
    'results',
    'assignments',
    'study-material',
    'certificates',
    'notifications',
    'reports',
    'documents',
    'settings',
  ],
};

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  getAllFeatures() {
    return FEATURE_CATALOG;
  }

  getFeaturesForRole(role: string) {
    const normalizedRole =
      role.toUpperCase() as RoleKey;

    const allowedKeys =
      ROLE_FEATURE_MAP[normalizedRole];

    if (!allowedKeys) {
      return [];
    }

    return FEATURE_CATALOG.filter((feature) =>
      (allowedKeys as readonly string[]).includes(
        feature.key,
      ),
    );
  }

  async getAvailableFeatures(
    institutionId: string,
    role: string,
  ) {
    const institution =
      await this.prisma.institution.findUnique({
        where: {
          id: institutionId,
        },
        select: {
          type: true,
        },
      });

    if (!institution) {
      return [];
    }

    const roleFeatures = new Set(
      this.getFeaturesForRole(role).map(
        (feature) => feature.key,
      ),
    );

    const institutionFeatures =
      INSTITUTION_FEATURES[institution.type] ?? [];

    return FEATURE_CATALOG.filter(
      (feature) =>
        roleFeatures.has(feature.key) &&
        institutionFeatures.includes(feature.key),
    );
  }

  async hasFeatureForInstitution(
    institutionId: string,
    role: string,
    featureKey: string,
  ) {
    const features =
      await this.getAvailableFeatures(
        institutionId,
        role,
      );

    return features.some(
      (feature) => feature.key === featureKey,
    );
  }

  hasFeature(
    role: string,
    featureKey: string,
  ) {
    const normalizedRole =
      role.toUpperCase() as RoleKey;

    const allowedKeys =
      ROLE_FEATURE_MAP[normalizedRole];

    if (!allowedKeys) {
      return false;
    }

    return (
      allowedKeys as readonly string[]
    ).includes(featureKey);
  }
}