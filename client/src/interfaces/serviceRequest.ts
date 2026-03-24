import { User } from "./user";
import { Service } from "./service";

export interface ServiceRequest {
  id: string;
  status?: string | null;
  title?: string | null;
  description?: string | null;
  username?: string | null;

  contractor?: User | null;
  vendor?: User | null;
  service?: Service | null;
}