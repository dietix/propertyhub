// User types and roles
export type UserRole = "admin" | "manager" | "viewer";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Property types
export type PropertyType =
  | "apartment"
  | "house"
  | "studio"
  | "villa"
  | "cabin"
  | "other";

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  description: string;
  basePrice: number;
  cleaningFee: number;
  images: string[];
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Reservation types
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "cancelled";
export type ReservationSource =
  | "airbnb"
  | "booking"
  | "vrbo"
  | "direct"
  | "other";

export interface Reservation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalAmount: number;
  cleaningFee: number;
  platformFee: number;
  status: ReservationStatus;
  source: ReservationSource;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Financial types
export type TransactionType = "income" | "expense";
export type ExpenseCategory =
  | "cleaning"
  | "maintenance"
  | "utilities"
  | "supplies"
  | "marketing"
  | "insurance"
  | "taxes"
  | "other";
export type IncomeCategory =
  | "reservation"
  | "cleaning_fee"
  | "extra_service"
  | "other";

export interface Transaction {
  id: string;
  propertyId: string;
  reservationId?: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Report types
export interface OccupancyReport {
  propertyId: string;
  propertyName: string;
  totalDays: number;
  occupiedDays: number;
  occupancyRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface FinancialReport {
  propertyId: string;
  propertyName: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  reservationsCount: number;
  averageDailyRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

// Date Block types
export interface DateBlock {
  id: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

// Access Code types
export interface AccessCode {
  id: string;
  propertyId: string;
  code: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  propertyId: string;
  title: string;
  start: Date;
  end: Date;
  type: "reservation" | "blocked" | "maintenance";
  color: string;
  reservation?: Reservation;
}

// Dashboard stats
export interface DashboardStats {
  totalProperties: number;
  activeReservations: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  occupancyRate: number;
}
