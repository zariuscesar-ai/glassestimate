import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// ---- Types ----
export interface CompanyRow {
  id: number;
  name: string;
  slug: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  invoice_prefix: string;
  invoice_next_number: number;
  default_tax_rate: number;
  default_due_days: number;
  default_notes: string;
  default_terms: string;
  created_at: string;
}

export interface ClientRow {
  id: number;
  company_id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  billing_address: string;
  shipping_address: string;
  notes: string;
  tags: string;
  lead_source: string;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: number;
  company_id: number;
  name: string;
  description: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  unit: string;
  category: string;
  tax_category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BundleRow {
  id: number;
  company_id: number;
  name: string;
  description: string;
  category: string;
  default_height_ft: number;
  price_per_linear_ft: number;
  glass_type: string;
  glass_thickness: string;
  frame_type: string;
  door_options: string;
  standard_lead_time_days: number;
  install_labor_hours_per_ft: number;
  created_at: string;
}

export interface BundleItemRow {
  id: number;
  bundle_id: number;
  product_id: number;
  quantity_per_unit: number;
  unit_type: string;
}

export interface InvoiceRow {
  id: number;
  company_id: number;
  client_id: number;
  invoice_number: string;
  type: 'invoice' | 'estimate';
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'accepted' | 'converted' | 'expired';
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  shipping: number;
  total: number;
  notes: string;
  terms: string;
  converted_invoice_id: number | null;
  visual_project_id: number | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  items?: InvoiceItemRow[];
  payments?: PaymentRow[];
}

export interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  product_name?: string;
}

export interface PaymentRow {
  id: number;
  invoice_id: number;
  amount: number;
  method: string;
  reference: string;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface VisualProjectRow {
  id: number;
  company_id: number;
  client_id: number;
  name: string;
  photo_url: string;
  drawing_data: string;
  floor_plan_data: string;
  scale_pixels_per_foot: number;
  total_glass_linear_ft: number;
  total_sheetrock_linear_ft: number;
  total_doors: number;
  wall_segments: string;
  status: 'draft' | 'estimated' | 'approved' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface JobRow {
  id: number;
  company_id: number;
  client_id: number;
  estimate_id: number | null;
  invoice_id: number | null;
  name: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'pending_materials' | 'ready_for_install' | 'completed' | 'on_hold';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  assigned_crew: string;
  job_site_address: string;
  glass_types: string;
  total_sq_ft: number;
  total_linear_ft: number;
  door_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
}

interface StoreData {
  companies: CompanyRow[];
  clients: ClientRow[];
  products: ProductRow[];
  bundles: BundleRow[];
  bundle_items: BundleItemRow[];
  invoices: InvoiceRow[];
  invoice_items: InvoiceItemRow[];
  payments: PaymentRow[];
  visual_projects: VisualProjectRow[];
  jobs: JobRow[];
  next_ids: Record<string, number>;
}

// ---- Store ----
let store: StoreData;

function defaultStore(): StoreData {
  return {
    companies: [{
      id: 1, name: 'Eagles Glass Inc', slug: 'eagles-glass',
      logo: '', address: '11105 Shady Trail Ste 122, Dallas, Texas 75229',
      phone: '214 447 8919', email: 'support@eaglesglass1.com',
      website: 'www.eaglesglassinc.com', tax_id: '',
      invoice_prefix: 'INV-', invoice_next_number: 1,
      default_tax_rate: 8.25, default_due_days: 30,
      default_notes: 'Thank you for choosing Eagles Glass Inc!',
      default_terms: 'Payment due within 30 days. 50% deposit required to begin work.',
      created_at: now(),
    }],
    clients: [],
    products: [
      // Tempered Glass Panels
      { id: 1, company_id: 1, name: '1/2" Tempered Glass Panel', description: 'Clear tempered glass, polished edges', sku: 'TG-050-CL', unit_price: 28.00, cost_price: 18.00, unit: 'sq ft', category: 'Tempered Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 2, company_id: 1, name: '3/8" Tempered Glass Panel', description: 'Clear tempered glass, polished edges', sku: 'TG-038-CL', unit_price: 22.00, cost_price: 14.00, unit: 'sq ft', category: 'Tempered Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 3, company_id: 1, name: '1/4" Tempered Glass Panel', description: 'Clear tempered glass, polished edges', sku: 'TG-025-CL', unit_price: 16.00, cost_price: 10.00, unit: 'sq ft', category: 'Tempered Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 4, company_id: 1, name: '1/2" Low-Iron Tempered Glass', description: 'Ultra-clear low-iron tempered, polished edges', sku: 'TG-050-LI', unit_price: 38.00, cost_price: 25.00, unit: 'sq ft', category: 'Tempered Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 5, company_id: 1, name: '1/2" Frosted Tempered Glass', description: 'Acid-etched frosted tempered, polished edges', sku: 'TG-050-FR', unit_price: 35.00, cost_price: 22.00, unit: 'sq ft', category: 'Tempered Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Laminated Glass
      { id: 6, company_id: 1, name: '1/2" Laminated Glass Panel', description: 'Clear laminated safety glass, polished edges', sku: 'LG-050-CL', unit_price: 32.00, cost_price: 20.00, unit: 'sq ft', category: 'Laminated Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 7, company_id: 1, name: '3/8" Laminated Glass Panel', description: 'Clear laminated safety glass, polished edges', sku: 'LG-038-CL', unit_price: 26.00, cost_price: 16.00, unit: 'sq ft', category: 'Laminated Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Insulated Glass Units
      { id: 8, company_id: 1, name: '1" Insulated Glass Unit (IGU)', description: 'Dual-pane 1/4" tempered + 1/2" air gap + 1/4" tempered', sku: 'IGU-100-CL', unit_price: 42.00, cost_price: 28.00, unit: 'sq ft', category: 'Insulated Glass', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Mirror
      { id: 9, company_id: 1, name: '1/4" Mirror Panel', description: 'Silver-backed mirror, polished edges', sku: 'MR-025-CL', unit_price: 18.00, cost_price: 11.00, unit: 'sq ft', category: 'Mirror', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Framing / Channels
      { id: 10, company_id: 1, name: 'Aluminum U-Channel (Top/Bottom)', description: '1/2" channel, clear anodized, 12ft length', sku: 'CH-U-050-12', unit_price: 14.00, cost_price: 8.00, unit: 'linear ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 11, company_id: 1, name: 'Aluminum U-Channel (3/8")', description: '3/8" channel, clear anodized, 12ft length', sku: 'CH-U-038-12', unit_price: 12.00, cost_price: 7.00, unit: 'linear ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 12, company_id: 1, name: 'Aluminum Base Shoe', description: 'Floor-mounted base shoe, clear anodized, 12ft', sku: 'CH-BS-12', unit_price: 16.00, cost_price: 9.00, unit: 'linear ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 13, company_id: 1, name: 'Aluminum H-Channel (Vertical)', description: 'Inter-panel vertical connector, clear anodized', sku: 'CH-H-12', unit_price: 18.00, cost_price: 10.00, unit: 'linear ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 14, company_id: 1, name: 'Storefront Aluminum Frame', description: 'Heavy-duty storefront framing system, dark bronze anodized', sku: 'SF-FR-12', unit_price: 28.00, cost_price: 16.00, unit: 'linear ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 15, company_id: 1, name: 'Aluminum Door Frame Kit', description: 'Complete door frame for glass door, clear anodized', sku: 'DF-KIT-CL', unit_price: 320.00, cost_price: 190.00, unit: 'each', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Door Hardware
      { id: 16, company_id: 1, name: 'Glass Door Patch Fitting (Top)', description: 'Top pivot patch fitting for frameless glass door', sku: 'DH-PF-TP', unit_price: 85.00, cost_price: 48.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 17, company_id: 1, name: 'Glass Door Patch Fitting (Bottom)', description: 'Bottom pivot patch fitting for frameless glass door', sku: 'DH-PF-BT', unit_price: 95.00, cost_price: 52.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 18, company_id: 1, name: 'Pull Handle - 36" Stainless Steel', description: '36" stainless steel tubular pull handle, brushed finish', sku: 'DH-PH-36-SS', unit_price: 120.00, cost_price: 65.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 19, company_id: 1, name: 'Pull Handle - 48" Stainless Steel', description: '48" stainless steel tubular pull handle, brushed finish', sku: 'DH-PH-48-SS', unit_price: 145.00, cost_price: 78.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 20, company_id: 1, name: 'Pull Handle - 60" Stainless Steel', description: '60" stainless steel tubular pull handle, brushed finish', sku: 'DH-PH-60-SS', unit_price: 170.00, cost_price: 92.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 21, company_id: 1, name: 'Lever Handle Set - Stainless', description: 'Commercial lever handle set with lock, stainless steel', sku: 'DH-LH-SS', unit_price: 185.00, cost_price: 105.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 22, company_id: 1, name: 'Lever Handle Set - Matte Black', description: 'Commercial lever handle set with lock, matte black', sku: 'DH-LH-MB', unit_price: 195.00, cost_price: 110.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 23, company_id: 1, name: 'Overhead Door Closer', description: 'Heavy-duty overhead concealed door closer', sku: 'DH-CL-OH', unit_price: 210.00, cost_price: 120.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 24, company_id: 1, name: 'Floor Spring Door Closer', description: 'Floor-mounted spring closer for heavy glass doors', sku: 'DH-CL-FS', unit_price: 340.00, cost_price: 195.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 25, company_id: 1, name: 'Sliding Door Track System', description: 'Top-hung sliding track with soft-close, 12ft kit', sku: 'DH-SD-TR', unit_price: 450.00, cost_price: 260.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 26, company_id: 1, name: 'Sliding Door Handle Set', description: 'Flush pull + edge pull for sliding glass door', sku: 'DH-SD-HS', unit_price: 95.00, cost_price: 50.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 27, company_id: 1, name: 'Panic Bar / Exit Device', description: 'Commercial push bar, rim type, 36"', sku: 'DH-PB-36', unit_price: 380.00, cost_price: 220.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 28, company_id: 1, name: 'Glass Door Hinge - Pair', description: 'Heavy-duty glass-to-glass hinges (2 pack)', sku: 'DH-HG-PR', unit_price: 160.00, cost_price: 88.00, unit: 'pair', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 29, company_id: 1, name: 'Glass Door Lock - Mortise', description: 'Mortise lock for frameless glass door', sku: 'DH-LK-MT', unit_price: 145.00, cost_price: 78.00, unit: 'each', category: 'Hardware', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      // Installation Labor
      { id: 30, company_id: 1, name: 'Frameless Glass Wall Installation', description: 'Labor for frameless glass wall system installation', sku: 'LB-FW-INST', unit_price: 45.00, cost_price: 28.00, unit: 'hour', category: 'Installation Labor', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 31, company_id: 1, name: 'Framed Partition Installation', description: 'Labor for framed glass partition installation', sku: 'LB-FP-INST', unit_price: 38.00, cost_price: 24.00, unit: 'hour', category: 'Installation Labor', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 32, company_id: 1, name: 'Storefront Installation', description: 'Labor for storefront system installation', sku: 'LB-SF-INST', unit_price: 52.00, cost_price: 32.00, unit: 'hour', category: 'Installation Labor', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 33, company_id: 1, name: 'Door Hardware Installation', description: 'Labor for door hardware installation per door', sku: 'LB-DH-INST', unit_price: 180.00, cost_price: 110.00, unit: 'each', category: 'Installation Labor', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 34, company_id: 1, name: 'Glass Removal & Disposal', description: 'Removal and disposal of existing glass/partitions', sku: 'LB-RM-DISP', unit_price: 8.00, cost_price: 4.00, unit: 'sq ft', category: 'Removal/Disposal', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
      { id: 35, company_id: 1, name: 'Sheetrock Wall Construction', description: 'Metal stud framing + sheetrock, tape & float, ready for paint', sku: 'SR-WALL', unit_price: 12.00, cost_price: 7.00, unit: 'sq ft', category: 'Framing', tax_category: 'standard', is_active: true, created_at: now(), updated_at: now() },
    ],
    bundles: [
      { id: 1, company_id: 1, name: '1/2" Frameless Glass Wall System', description: 'Floor-to-ceiling frameless glass wall with top and bottom U-channel. Includes 1/2" tempered glass, aluminum U-channel, silicone sealant.', category: 'Glass Wall', default_height_ft: 9, price_per_linear_ft: 85.00, glass_type: 'Tempered', glass_thickness: '1/2"', frame_type: 'U-Channel (Top & Bottom)', door_options: 'Swing Door, Sliding Door', standard_lead_time_days: 14, install_labor_hours_per_ft: 0.5, created_at: now() },
      { id: 2, company_id: 1, name: '3/8" Frameless Glass Wall System', description: 'Floor-to-ceiling frameless glass wall with top and bottom U-channel. Includes 3/8" tempered glass, aluminum U-channel, silicone sealant. Lighter weight option.', category: 'Glass Wall', default_height_ft: 9, price_per_linear_ft: 65.00, glass_type: 'Tempered', glass_thickness: '3/8"', frame_type: 'U-Channel (Top & Bottom)', door_options: 'Swing Door, Sliding Door', standard_lead_time_days: 14, install_labor_hours_per_ft: 0.4, created_at: now() },
      { id: 3, company_id: 1, name: 'Framed Glass Office Partition', description: 'Aluminum-framed glass partition system. Includes 1/4" tempered glass panels in aluminum frames, door frame kit. Professional office look.', category: 'Office Partition', default_height_ft: 9, price_per_linear_ft: 55.00, glass_type: 'Tempered', glass_thickness: '1/4"', frame_type: 'Aluminum Frame', door_options: 'Swing Door', standard_lead_time_days: 10, install_labor_hours_per_ft: 0.3, created_at: now() },
      { id: 4, company_id: 1, name: 'Storefront Glass System', description: 'Heavy-duty commercial storefront system. Includes 1/4" tempered glass, dark bronze aluminum framing, weather sealing. For exterior/interior entrances.', category: 'Storefront', default_height_ft: 10, price_per_linear_ft: 95.00, glass_type: 'Tempered', glass_thickness: '1/4"', frame_type: 'Storefront Aluminum Frame', door_options: 'Swing Door, Panic Bar', standard_lead_time_days: 21, install_labor_hours_per_ft: 0.6, created_at: now() },
      { id: 5, company_id: 1, name: 'Glass Wall with Frameless Swing Door', description: '1/2" frameless glass wall system with integrated frameless swing door. Includes patch fittings, pull handle, closer, lock.', category: 'Glass Wall + Door', default_height_ft: 9, price_per_linear_ft: 110.00, glass_type: 'Tempered', glass_thickness: '1/2"', frame_type: 'U-Channel + Door Frame', door_options: 'Frameless Swing Door included', standard_lead_time_days: 21, install_labor_hours_per_ft: 0.7, created_at: now() },
      { id: 6, company_id: 1, name: 'Glass Wall with Sliding Door', description: '1/2" frameless glass wall system with top-hung sliding glass door. Includes sliding track, soft-close, flush pulls.', category: 'Glass Wall + Door', default_height_ft: 9, price_per_linear_ft: 125.00, glass_type: 'Tempered', glass_thickness: '1/2"', frame_type: 'U-Channel + Sliding Track', door_options: 'Sliding Door included', standard_lead_time_days: 21, install_labor_hours_per_ft: 0.8, created_at: now() },
      { id: 7, company_id: 1, name: 'Floor-to-Ceiling Glass Partition', description: 'Full-height glass partition from floor to ceiling slab. 1/2" tempered glass with base shoe and head channel. Maximum transparency.', category: 'Glass Wall', default_height_ft: 10, price_per_linear_ft: 95.00, glass_type: 'Tempered', glass_thickness: '1/2"', frame_type: 'Base Shoe + Head Channel', door_options: 'Swing Door, Sliding Door', standard_lead_time_days: 21, install_labor_hours_per_ft: 0.6, created_at: now() },
      { id: 8, company_id: 1, name: 'Glass + Sheetrock Hybrid Wall', description: 'Combination wall: glass upper section + sheetrock lower section on metal stud framing. Best of both worlds — light transmission + privacy.', category: 'Hybrid', default_height_ft: 9, price_per_linear_ft: 45.00, glass_type: 'Tempered', glass_thickness: '3/8"', frame_type: 'Metal Stud + U-Channel', door_options: 'Swing Door', standard_lead_time_days: 14, install_labor_hours_per_ft: 0.5, created_at: now() },
    ],
    bundle_items: [],
    invoices: [],
    invoice_items: [],
    payments: [],
    visual_projects: [],
    jobs: [],
    next_ids: { companies: 2, clients: 1, products: 1, bundles: 1, bundle_items: 1, invoices: 1, invoice_items: 1, payments: 1, visual_projects: 1, jobs: 1 },
  };
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const def = defaultStore();
      for (const k of Object.keys(def)) {
        if (!(k in data)) (data as any)[k] = (def as any)[k];
      }
      return data as StoreData;
    }
  } catch (err) {
    console.error('Corrupted data, starting fresh:', err);
    try { fs.copyFileSync(DATA_FILE, DATA_FILE + '.corrupted.bak'); } catch {}
  }
  return defaultStore();
}

function saveStore() {
  const tmp = DATA_FILE + '.tmp';
  try { fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8'); fs.renameSync(tmp, DATA_FILE); }
  catch (err) { console.error('Save failed:', err); }
}

function now(): string { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

store = loadStore();

// ---- Helpers ----
function filterByCompany<T extends { company_id?: number }>(arr: T[], companyId: number): T[] {
  return arr.filter((item) => !item.company_id || item.company_id === companyId);
}

// ---- DB API ----
export const db = {
  companies: {
    all(): CompanyRow[] { return [...store.companies]; },
    getById(id: number) { return store.companies.find((c) => c.id === id); },
    getBySlug(slug: string) { return store.companies.find((c) => c.slug === slug); },
    insert(data: Partial<CompanyRow>): CompanyRow {
      const row: CompanyRow = {
        id: store.next_ids.companies++,
        name: data.name || '', slug: data.slug || `company-${store.next_ids.companies}`,
        logo: data.logo || '', address: data.address || '', phone: data.phone || '',
        email: data.email || '', website: data.website || '', tax_id: data.tax_id || '',
        invoice_prefix: data.invoice_prefix || 'INV-', invoice_next_number: data.invoice_next_number || 1,
        default_tax_rate: data.default_tax_rate ?? 0, default_due_days: data.default_due_days || 30,
        default_notes: data.default_notes || '', default_terms: data.default_terms || '',
        created_at: now(),
      };
      store.companies.push(row); saveStore(); return row;
    },
    update(id: number, data: Partial<CompanyRow>): CompanyRow | null {
      const idx = store.companies.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.companies[idx] = { ...store.companies[idx], ...data, id };
      saveStore(); return store.companies[idx];
    },
  },

  clients: {
    all(companyId: number): ClientRow[] {
      return filterByCompany(store.clients, companyId).sort((a, b) => a.name.localeCompare(b.name));
    },
    getById(id: number) { return store.clients.find((c) => c.id === id); },
    insert(data: Partial<ClientRow>): ClientRow {
      const row: ClientRow = {
        id: store.next_ids.clients++, company_id: data.company_id || 1,
        name: data.name || '', contact_person: data.contact_person || '',
        email: data.email || '', phone: data.phone || '',
        billing_address: data.billing_address || '', shipping_address: data.shipping_address || '',
        notes: data.notes || '', tags: data.tags || '', lead_source: data.lead_source || '',
        created_at: now(), updated_at: now(),
      };
      store.clients.push(row); saveStore(); return row;
    },
    update(id: number, data: Partial<ClientRow>): ClientRow | null {
      const idx = store.clients.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.clients[idx] = { ...store.clients[idx], ...data, id, updated_at: now() };
      saveStore(); return store.clients[idx];
    },
    delete(id: number): boolean {
      const idx = store.clients.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      store.clients.splice(idx, 1); saveStore(); return true;
    },
    getClientStats(companyId: number, clientId: number) {
      const clientInvoices = store.invoices.filter((i) => i.company_id === companyId && i.client_id === clientId);
      const totalSpent = clientInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
      const outstanding = clientInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => {
        const paid = store.payments.filter((p) => p.invoice_id === i.id).reduce((sp, p) => sp + p.amount, 0);
        return s + (i.total - paid);
      }, 0);
      return { totalInvoices: clientInvoices.length, totalSpent, outstanding };
    },
  },

  products: {
    all(companyId: number, filter?: { category?: string; search?: string }): ProductRow[] {
      let list = filterByCompany(store.products, companyId);
      if (filter?.category) list = list.filter((p) => p.category === filter.category);
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      return list.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name));
    },
    getById(id: number) { return store.products.find((p) => p.id === id); },
    insert(data: Partial<ProductRow>): ProductRow {
      const row: ProductRow = {
        id: store.next_ids.products++, company_id: data.company_id || 1,
        name: data.name || '', description: data.description || '', sku: data.sku || '',
        unit_price: data.unit_price ?? 0, cost_price: data.cost_price ?? 0,
        unit: data.unit || 'each', category: data.category || '', tax_category: data.tax_category || 'standard',
        is_active: data.is_active ?? true, created_at: now(), updated_at: now(),
      };
      store.products.push(row); saveStore(); return row;
    },
    update(id: number, data: Partial<ProductRow>): ProductRow | null {
      const idx = store.products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      store.products[idx] = { ...store.products[idx], ...data, id, updated_at: now() };
      saveStore(); return store.products[idx];
    },
    delete(id: number): boolean {
      const idx = store.products.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      store.products.splice(idx, 1); saveStore(); return true;
    },
    categories(companyId: number): string[] {
      return [...new Set(filterByCompany(store.products, companyId).map((p) => p.category).filter(Boolean))];
    },
  },

  bundles: {
    all(companyId: number): BundleRow[] {
      return filterByCompany(store.bundles, companyId).sort((a, b) => a.name.localeCompare(b.name));
    },
    getById(id: number) { return store.bundles.find((b) => b.id === id); },
    insert(data: Partial<BundleRow>, items?: { product_id: number; quantity_per_unit: number; unit_type: string }[]): BundleRow {
      const row: BundleRow = {
        id: store.next_ids.bundles++, company_id: data.company_id || 1,
        name: data.name || '', description: data.description || '', category: data.category || '',
        default_height_ft: data.default_height_ft || 9,
        price_per_linear_ft: data.price_per_linear_ft || 0,
        glass_type: data.glass_type || '', glass_thickness: data.glass_thickness || '',
        frame_type: data.frame_type || '', door_options: data.door_options || '',
        standard_lead_time_days: data.standard_lead_time_days || 14,
        install_labor_hours_per_ft: data.install_labor_hours_per_ft || 0.5,
        created_at: now(),
      };
      store.bundles.push(row);
      if (items) {
        for (const item of items) {
          store.bundle_items.push({ id: store.next_ids.bundle_items++, bundle_id: row.id, ...item });
        }
      }
      saveStore(); return row;
    },
  },

  invoices: {
    all(companyId: number, filter?: { status?: string; client_id?: number; search?: string; type?: string }): InvoiceRow[] {
      let list = store.invoices.filter((i) => i.company_id === companyId);
      if (filter?.status) list = list.filter((i) => i.status === filter.status);
      if (filter?.client_id) list = list.filter((i) => i.client_id === filter.client_id);
      if (filter?.type) list = list.filter((i) => i.type === filter.type);
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        const cm = new Map(store.clients.map((c) => [c.id, c]));
        list = list.filter((i) => i.invoice_number.toLowerCase().includes(s) || (cm.get(i.client_id)?.name || '').toLowerCase().includes(s));
      }
      const cm = new Map(store.clients.map((c) => [c.id, c]));
      for (const inv of list) {
        inv.client_name = cm.get(inv.client_id)?.name;
        inv.items = store.invoice_items.filter((ii) => ii.invoice_id === inv.id).sort((a, b) => a.sort_order - b.sort_order);
        inv.payments = store.payments.filter((p) => p.invoice_id === inv.id);
      }
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    getById(id: number): InvoiceRow | undefined {
      const inv = store.invoices.find((i) => i.id === id);
      if (!inv) return undefined;
      const client = store.clients.find((c) => c.id === inv.client_id);
      inv.client_name = client?.name;
      inv.items = store.invoice_items.filter((ii) => ii.invoice_id === id).sort((a, b) => a.sort_order - b.sort_order);
      inv.payments = store.payments.filter((p) => p.invoice_id === id);
      return inv;
    },
    insert(companyId: number, data: {
      client_id: number; type?: string; issue_date: string; due_date: string;
      items: { product_id?: number | null; description: string; quantity: number; unit_price: number }[];
      tax_rate?: number; discount_type?: string; discount_value?: number;
      shipping?: number; notes?: string; terms?: string; visual_project_id?: number | null;
    }): InvoiceRow {
      const co = store.companies.find((c) => c.id === companyId)!;
      const num = co.invoice_next_number;
      const prefix = data.type === 'estimate' ? 'EST-' : co.invoice_prefix;
      const invoiceNumber = `${prefix}${String(num).padStart(4, '0')}`;

      co.invoice_next_number = num + 1;
      const idx = store.companies.findIndex((c) => c.id === companyId);
      store.companies[idx] = co;

      const rate = data.tax_rate ?? co.default_tax_rate;
      const discType = data.discount_type || 'none';
      const discValue = data.discount_value || 0;
      let subtotal = 0;
      for (const item of data.items) subtotal += (item.quantity || 0) * (item.unit_price || 0);
      let discAmt = 0;
      if (discType === 'percent') discAmt = subtotal * (discValue / 100);
      else if (discType === 'fixed') discAmt = discValue;
      const after = subtotal - discAmt;
      const taxAmt = after * (rate / 100);
      const total = after + taxAmt + (data.shipping || 0);

      const row: InvoiceRow = {
        id: store.next_ids.invoices++, company_id: companyId, client_id: data.client_id,
        invoice_number: invoiceNumber, type: (data.type as InvoiceRow['type']) || 'invoice',
        issue_date: data.issue_date, due_date: data.due_date, status: 'draft',
        subtotal: Math.round(subtotal * 100) / 100,
        discount_type: discType, discount_value: discValue,
        discount_amount: Math.round(discAmt * 100) / 100,
        tax_rate: rate, tax_amount: Math.round(taxAmt * 100) / 100,
        shipping: data.shipping || 0, total: Math.round(total * 100) / 100,
        notes: data.notes || co.default_notes, terms: data.terms || co.default_terms,
        converted_invoice_id: null, visual_project_id: data.visual_project_id || null,
        created_at: now(), updated_at: now(),
      };
      store.invoices.push(row);
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i];
        store.invoice_items.push({
          id: store.next_ids.invoice_items++, invoice_id: row.id,
          product_id: it.product_id || null, description: it.description,
          quantity: it.quantity, unit_price: it.unit_price,
          amount: Math.round(it.quantity * it.unit_price * 100) / 100, sort_order: i,
        });
      }
      saveStore(); return this.getById(row.id)!;
    },
    update(id: number, data: Partial<InvoiceRow> & { items?: { product_id?: number | null; description: string; quantity: number; unit_price: number }[] }): InvoiceRow | null {
      const idx = store.invoices.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      const existing = store.invoices[idx];
      if (data.items) {
        let subtotal = 0;
        for (const it of data.items) subtotal += (it.quantity || 0) * (it.unit_price || 0);
        const rate = data.tax_rate ?? existing.tax_rate;
        const dt = data.discount_type || existing.discount_type;
        const dv = data.discount_value ?? existing.discount_value;
        let da = 0;
        if (dt === 'percent') da = subtotal * (dv / 100);
        else if (dt === 'fixed') da = dv;
        const after = subtotal - da;
        data.subtotal = Math.round(subtotal * 100) / 100;
        data.tax_amount = Math.round(after * (rate / 100) * 100) / 100;
        data.discount_amount = Math.round(da * 100) / 100;
        data.total = Math.round((after + data.tax_amount + (data.shipping ?? existing.shipping)) * 100) / 100;
      }
      const updated = { ...existing, ...data, id, updated_at: now() };
      store.invoices[idx] = updated;
      if (data.items) {
        store.invoice_items = store.invoice_items.filter((ii) => ii.invoice_id !== id);
        for (let i = 0; i < data.items.length; i++) {
          const it = data.items[i];
          store.invoice_items.push({
            id: store.next_ids.invoice_items++, invoice_id: id,
            product_id: it.product_id || null, description: it.description,
            quantity: it.quantity, unit_price: it.unit_price,
            amount: Math.round(it.quantity * it.unit_price * 100) / 100, sort_order: i,
          });
        }
      }
      saveStore(); return this.getById(id) || null;
    },
    delete(id: number): boolean {
      const idx = store.invoices.findIndex((i) => i.id === id);
      if (idx === -1) return false;
      store.invoices.splice(idx, 1);
      store.invoice_items = store.invoice_items.filter((ii) => ii.invoice_id !== id);
      store.payments = store.payments.filter((p) => p.invoice_id !== id);
      saveStore(); return true;
    },
    convertToInvoice(estimateId: number): InvoiceRow | null {
      const estimate = this.getById(estimateId);
      if (!estimate || estimate.type !== 'estimate') return null;
      const co = store.companies.find((c) => c.id === estimate.company_id)!;
      const num = co.invoice_next_number;
      const invNum = `${co.invoice_prefix}${String(num).padStart(4, '0')}`;
      co.invoice_next_number = num + 1;
      const idxC = store.companies.findIndex((c) => c.id === estimate.company_id);
      store.companies[idxC] = co;
      const row: InvoiceRow = {
        id: store.next_ids.invoices++, company_id: estimate.company_id, client_id: estimate.client_id,
        invoice_number: invNum, type: 'invoice', issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + co.default_due_days * 86400000).toISOString().split('T')[0],
        status: 'draft', subtotal: estimate.subtotal, discount_type: estimate.discount_type,
        discount_value: estimate.discount_value, discount_amount: estimate.discount_amount,
        tax_rate: estimate.tax_rate, tax_amount: estimate.tax_amount,
        shipping: estimate.shipping, total: estimate.total,
        notes: estimate.notes, terms: estimate.terms,
        converted_invoice_id: null, visual_project_id: estimate.visual_project_id,
        created_at: now(), updated_at: now(),
      };
      store.invoices.push(row);
      for (const it of (estimate.items || [])) {
        store.invoice_items.push({
          id: store.next_ids.invoice_items++, invoice_id: row.id,
          product_id: it.product_id, description: it.description,
          quantity: it.quantity, unit_price: it.unit_price,
          amount: it.amount, sort_order: it.sort_order,
        });
      }
      // Update estimate
      const estIdx = store.invoices.findIndex((i) => i.id === estimateId);
      store.invoices[estIdx].status = 'converted';
      store.invoices[estIdx].converted_invoice_id = row.id;
      store.invoices[estIdx].updated_at = now();
      saveStore();
      return row;
    },

    updateStatus(id: number, status: string): InvoiceRow | null {
      const idx = store.invoices.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      store.invoices[idx].status = status as InvoiceRow['status'];
      store.invoices[idx].updated_at = now();
      saveStore();
      return this.getById(id)!;
    },
  },

  payments: {
    all(): PaymentRow[] {
      return [...store.payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
    },

    byInvoice(invoiceId: number): PaymentRow[] {
      return store.payments.filter((p) => p.invoice_id === invoiceId).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
    },
    insert(data: { invoice_id: number; amount: number; method: string; reference?: string; payment_date: string; notes?: string }): PaymentRow {
      const row: PaymentRow = {
        id: store.next_ids.payments++, invoice_id: data.invoice_id,
        amount: data.amount, method: data.method, reference: data.reference || '',
        payment_date: data.payment_date, notes: data.notes || '', created_at: now(),
      };
      store.payments.push(row);
      // Auto-update invoice status if fully paid
      const inv = store.invoices.find((i) => i.id === data.invoice_id);
      if (inv) {
        const totalPaid = store.payments.filter((p) => p.invoice_id === inv.id).reduce((s, p) => s + p.amount, 0);
        if (totalPaid >= inv.total) {
          inv.status = 'paid';
          inv.updated_at = now();
        }
      }
      saveStore(); return row;
    },
    delete(id: number): boolean {
      const idx = store.payments.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      store.payments.splice(idx, 1); saveStore(); return true;
    },
  },

  visual: {
    all(companyId: number): VisualProjectRow[] {
      return filterByCompany(store.visual_projects, companyId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    getById(id: number) { return store.visual_projects.find((v) => v.id === id); },
    insert(data: Partial<VisualProjectRow>): VisualProjectRow {
      const row: VisualProjectRow = {
        id: store.next_ids.visual_projects++, company_id: data.company_id || 1,
        client_id: data.client_id || 0, name: data.name || '', photo_url: data.photo_url || '',
        drawing_data: data.drawing_data || '[]', floor_plan_data: data.floor_plan_data || '[]',
        scale_pixels_per_foot: data.scale_pixels_per_foot || 0,
        total_glass_linear_ft: 0, total_sheetrock_linear_ft: 0, total_doors: 0,
        wall_segments: data.wall_segments || '[]', status: 'draft',
        created_at: now(), updated_at: now(),
      };
      store.visual_projects.push(row); saveStore(); return row;
    },
    update(id: number, data: Partial<VisualProjectRow>): VisualProjectRow | null {
      const idx = store.visual_projects.findIndex((v) => v.id === id);
      if (idx === -1) return null;
      store.visual_projects[idx] = { ...store.visual_projects[idx], ...data, id, updated_at: now() };
      saveStore(); return store.visual_projects[idx];
    },
    delete(id: number): boolean {
      const idx = store.visual_projects.findIndex((v) => v.id === id);
      if (idx === -1) return false;
      store.visual_projects.splice(idx, 1); saveStore(); return true;
    },
  },

  // ---- Jobs ----
  jobs: {
    all(companyId: number): JobRow[] {
      const list = store.jobs.filter((j) => j.company_id === companyId);
      const cm = new Map(store.clients.map((c) => [c.id, c]));
      for (const j of list) j.client_name = cm.get(j.client_id)?.name;
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    getById(id: number): JobRow | undefined {
      const j = store.jobs.find((x) => x.id === id);
      if (j) j.client_name = store.clients.find((c) => c.id === j.client_id)?.name;
      return j;
    },
    insert(data: Partial<JobRow>): JobRow {
      const row: JobRow = {
        id: store.next_ids.jobs++, company_id: data.company_id || 1,
        client_id: data.client_id || 0, estimate_id: data.estimate_id || null,
        invoice_id: data.invoice_id || null, name: data.name || '',
        description: data.description || '', status: 'scheduled',
        priority: data.priority || 'normal', start_date: data.start_date || '',
        end_date: data.end_date || '', assigned_crew: data.assigned_crew || '',
        job_site_address: data.job_site_address || '',
        glass_types: data.glass_types || '', total_sq_ft: data.total_sq_ft || 0,
        total_linear_ft: data.total_linear_ft || 0, door_count: data.door_count || 0,
        notes: data.notes || '', created_at: now(), updated_at: now(),
      };
      store.jobs.push(row); saveStore(); return row;
    },
    update(id: number, data: Partial<JobRow>): JobRow | null {
      const idx = store.jobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      store.jobs[idx] = { ...store.jobs[idx], ...data, id, updated_at: now() };
      saveStore(); return store.jobs[idx];
    },
    delete(id: number): boolean {
      const idx = store.jobs.findIndex((j) => j.id === id);
      if (idx === -1) return false;
      store.jobs.splice(idx, 1); saveStore(); return true;
    },
  },

  // Dashboard stats
  stats(companyId: number) {
    const invoices = store.invoices.filter((i) => i.company_id === companyId && i.type === 'invoice');
    const estimates = store.invoices.filter((i) => i.company_id === companyId && i.type === 'estimate');
    const now = new Date();
    const thisMonth = invoices.filter((i) => {
      const d = new Date(i.issue_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = invoices.filter((i) => {
      const d = new Date(i.issue_date);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    const ytd = invoices.filter((i) => new Date(i.issue_date).getFullYear() === now.getFullYear());
    const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
    const overdue = invoices.filter((i) => i.status === 'overdue');
    const revenueThisMonth = thisMonth.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const revenueLastMonth = lastMonth.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const revenueYTD = ytd.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const outstandingTotal = outstanding.reduce((s, i) => {
      const paid = store.payments.filter((p) => p.invoice_id === i.id).reduce((sp, p) => sp + p.amount, 0);
      return s + (i.total - paid);
    }, 0);
    const estimatesPending = estimates.filter((i) => i.status === 'sent').length;

    return {
      totalClients: filterByCompany(store.clients, companyId).length,
      totalProducts: filterByCompany(store.products, companyId).length,
      totalInvoices: invoices.length,
      totalEstimates: estimates.length,
      revenueThisMonth,
      revenueLastMonth,
      revenueYTD,
      outstandingTotal,
      overdueCount: overdue.length,
      estimatesPending,
      recentInvoices: invoices.slice(0, 5).map((i) => {
        const client = store.clients.find((c) => c.id === i.client_id);
        return { ...i, client_name: client?.name };
      }),
    };
  },
};
