import { Shield, Building2, Stethoscope, User, FlaskConical, ClipboardList, Banknote } from "lucide-react"

// Role keys are the single source of truth for RBAC across the app.
export const ROLE_KEYS = {
  SUPER_ADMIN: "superadmin",
  HOSPITAL_ADMIN: "hospital_admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
  LAB_TECH: "lab_tech",
  RECEPTIONIST: "receptionist",
  CASHIER: "cashier",
  ARCHIVIST: "archivist",
  USER: "user",
}

// Role metadata: label keys, accent colors and demo identities.
// `tenant` mirrors the multi-tenant model — Super Admin spans all tenants.
export const roles = {
  [ROLE_KEYS.SUPER_ADMIN]: {
    key: ROLE_KEYS.SUPER_ADMIN,
    labelKey: "roles.superadmin",
    icon: Shield,
    tone: "primary",
    user: {
      name: "Adaeze Okonkwo",
      email: "adaeze@shambua.cloud",
      title: "Platform Administrator",
      initials: "AO",
      tenant: null,
      tenantLabel: "All Tenants",
    },
  },
  [ROLE_KEYS.HOSPITAL_ADMIN]: {
    key: ROLE_KEYS.HOSPITAL_ADMIN,
    labelKey: "roles.hospital_admin",
    icon: Building2,
    tone: "secondary",
    user: {
      name: "Dr. Kwame Mensah",
      email: "kwame.mensah@shambua.health",
      title: "Chief Medical Officer",
      initials: "KM",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.DOCTOR]: {
    key: ROLE_KEYS.DOCTOR,
    labelKey: "roles.doctor",
    icon: Stethoscope,
    tone: "accent",
    user: {
      name: "Dr. Ngozi Achebe",
      email: "ngozi.achebe@shambua.health",
      title: "Cardiologist",
      initials: "NA",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.PATIENT]: {
    key: ROLE_KEYS.PATIENT,
    labelKey: "roles.patient",
    icon: User,
    tone: "primary",
    user: {
      name: "Amara Diallo",
      email: "amara.diallo@gmail.com",
      title: "Patient · #PT-10293",
      initials: "AD",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.LAB_TECH]: {
    key: ROLE_KEYS.LAB_TECH,
    labelKey: "roles.lab_tech",
    icon: FlaskConical,
    tone: "secondary",
    user: {
      name: "Ibrahim Cissé",
      email: "ibrahim.cisse@shambua.health",
      title: "Senior Lab Technician",
      initials: "IC",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.RECEPTIONIST]: {
    key: ROLE_KEYS.RECEPTIONIST,
    labelKey: "roles.receptionist",
    icon: ClipboardList,
    tone: "accent",
    user: {
      name: "Fatou Ndiaye",
      email: "fatou.ndiaye@shambua.health",
      title: "Front Desk Coordinator",
      initials: "FN",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.CASHIER]: {
    key: ROLE_KEYS.CASHIER,
    labelKey: "roles.cashier",
    icon: Banknote,
    tone: "primary",
    user: {
      name: "Marie Kouassi",
      email: "marie.kouassi@shambua.health",
      title: "Agent de caisse",
      initials: "MK",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.USER]: {
    key: ROLE_KEYS.USER,
    labelKey: "roles.user",
    icon: User,
    tone: "secondary",
    user: {
      name: "Staff User",
      email: "staff@shambua.health",
      title: "Staff Member",
      initials: "SU",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
  [ROLE_KEYS.ARCHIVIST]: {
    key: ROLE_KEYS.ARCHIVIST,
    labelKey: "roles.archivist",
    icon: ClipboardList,
    tone: "secondary",
    user: {
      name: "Amina Diallo",
      email: "amina.diallo@shambua.health",
      title: "Hospital Archivist",
      initials: "AD",
      tenant: "accra-central",
      tenantLabel: "Accra Central Hospital",
    },
  },
}

export const roleList = Object.values(roles)

export const DEFAULT_ROLE = ROLE_KEYS.HOSPITAL_ADMIN
