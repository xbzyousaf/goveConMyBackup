import { VendorProfile } from "./vendorProfile";

export interface Service {
  name?: string | null;
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  vendorId:string;
  vendorProfile : VendorProfile | null
}