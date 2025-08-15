export const EMAIL_DOMAINS = [
  '', // Placeholder for select
  '@engug.ruh.ac.lk',
  '@ar.ruh.ac.lk',
  '@cee.ruh.ac.lk',
  '@mme.ruh.ac.lk',
  '@eie.ruh.ac.lk',
  // '@eng.ruh.ac.lk',
  // '@lib.ruh.ac.lk',
  // '@cis.ruh.ac.lk',
];

export const DEPARTMENT_MAP: Record<string, { value: string; label: string }> = {
  'cee.ruh.ac.lk': { value: 'civil', label: 'Civil' },
  'mme.ruh.ac.lk': { value: 'mechanical', label: 'Mechanical' },
  'eie.ruh.ac.lk': { value: 'electrical', label: 'Electrical' },
  // 'eng.ruh.ac.lk': { value: 'faculty', label: 'Faculty' },
  // 'lib.ruh.ac.lk': { value: 'library', label: 'Library' },
  // 'cis.ruh.ac.lk': { value: 'it', label: 'IT' },
};

export const ALL_DEPARTMENTS = [
  { value: 'civil', label: 'Civil' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'electrical', label: 'Electrical' },
  // { value: 'faculty', label: 'Faculty' },
  // { value: 'library', label: 'Library' },
  // { value: 'it', label: 'IT' },
  // { value: 'admin', label: 'Admin' },
];

export const TITLE_OPTIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'miss', label: 'Miss' },
  { value: 'prof', label: 'Prof' },
  { value: 'dr', label: 'Dr' },
];