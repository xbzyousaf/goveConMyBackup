export interface UserMaturityProfile {
  id: string;
  userId: string;
  maturityStage: 'startup' | 'growth' | 'scale';
  readinessScore: number;
  currentFocus: 'business_structure' | 'business_strategy' | 'execution';
  businessStructureProgress: number | null;
  businessStrategyProgress: number | null;
  executionProgress: number | null;
  subscriptionTier: 'beta' | 'pilot';
  assessmentData: any;
  createdAt: string;
  updatedAt: string;
}