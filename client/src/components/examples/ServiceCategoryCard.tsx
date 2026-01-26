import { ServiceCategoryCard } from '../ServiceCategoryCard';
import { Scale, Users, DollarSign, Shield, Megaphone, Settings } from 'lucide-react';

export default function ServiceCategoryCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ServiceCategoryCard
        title="Legal & Compliance"
        description="Contract review, regulatory compliance, and legal advisory services"
        icon={Scale}
        vendorCount={12}
        featured={true}
      />
      <ServiceCategoryCard
        title="HR & Talent"
        description="Recruitment, payroll, benefits administration, and HR consulting"
        icon={Users}
        vendorCount={8}
      />
      <ServiceCategoryCard
        title="Finance & Accounting"
        description="Bookkeeping, tax preparation, financial planning, and auditing"
        icon={DollarSign}
        vendorCount={15}
      />
      <ServiceCategoryCard
        title="IT & Cybersecurity"
        description="System administration, security audits, and technical infrastructure"
        icon={Shield}
        vendorCount={10}
      />
      <ServiceCategoryCard
        title="Marketing & Branding"
        description="Digital marketing, brand development, and proposal writing"
        icon={Megaphone}
        vendorCount={6}
      />
      <ServiceCategoryCard
        title="Business Tools"
        description="CRM setup, ERP implementation, and operational software"
        icon={Settings}
        vendorCount={9}
      />
    </div>
  );
}