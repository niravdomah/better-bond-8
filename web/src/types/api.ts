// API types matching the OpenAPI schema

export interface DefaultResponse {
  Id?: number;
  MessageType?: string;
  Messages?: string[];
}

export interface PaymentRead {
  Id: number;
  Reference?: string;
  AgencyName: string;
  ClaimDate: string;
  AgentName: string;
  AgentSurname: string;
  LastChangedUser?: string;
  LastChangedDate?: string;
  BondAmount: number;
  CommissionType: string;
  CommissionPct: number;
  GrantDate: string;
  RegistrationDate: string;
  Bank: string;
  CommissionAmount: number;
  VAT: number;
  Status: string;
  BatchId?: string | null;
}

export interface PaymentReadList {
  PaymentList: PaymentRead[];
}

export interface PaymentBatchRead {
  Id: number;
  CreatedDate: string;
  Status: string;
  Reference: string;
  LastChangedUser: string;
  AgencyName: string;
  PaymentCount: number;
  TotalCommissionAmount: number;
  TotalVat: number;
}

export interface PaymentBatchReadList {
  PaymentBatchList: PaymentBatchRead[];
}

export interface PaymentStatusReportItem {
  Status: string;
  PaymentCount: number;
  TotalPaymentAmount: number;
  CommissionType: string;
  AgencyName: string;
}

export interface ParkedPaymentsAgingReportItem {
  Range: string;
  AgencyName: string;
  PaymentCount: number;
}

export interface PaymentsByAgencyReportItem {
  AgencyName: string;
  PaymentCount: number;
  TotalCommissionAmount: number;
  Vat: number;
}

export interface PaymentsDashboardRead {
  PaymentStatusReport: PaymentStatusReportItem[];
  ParkedPaymentsAgingReport: ParkedPaymentsAgingReportItem[];
  TotalPaymentCountInLast14Days: number;
  PaymentsByAgency: PaymentsByAgencyReportItem[];
}
