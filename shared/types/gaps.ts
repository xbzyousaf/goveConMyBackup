import { ServiceCategory } from "./service";

export type GapType =
  | ServiceCategory
  | "certifications";

export interface Gap {
  type: GapType;
  problem: string;
}