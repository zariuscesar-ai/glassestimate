export type { CompanyRow as Company, ClientRow as Client, ProductRow as Product, BundleRow as Bundle, InvoiceRow as Invoice, InvoiceItemRow as InvoiceItem, PaymentRow as Payment, VisualProjectRow as VisualProject } from './db';

export interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalInvoices: number;
  totalEstimates: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueYTD: number;
  outstandingTotal: number;
  overdueCount: number;
  estimatesPending: number;
  recentInvoices: Array<{ id: number; invoice_number: string; client_name?: string; issue_date: string; total: number; status: string }>;
}
