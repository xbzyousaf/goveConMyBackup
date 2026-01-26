import { VendorCard } from '../VendorCard';

export default function VendorCardExample() {
  // todo: remove mock functionality
  const mockVendors = [
    {
      name: "Sarah Johnson",
      title: "Federal Contract Attorney",
      category: "Legal",
      rating: 4.9,
      reviewCount: 127,
      location: "Washington, DC",
      responseTime: "2-4 hours",
      hourlyRate: 150,
      isVerified: true,
      skills: ["Contract Review", "Compliance", "FAR/DFARS", "Proposal Support"]
    },
    {
      name: "Marcus Chen",
      title: "Cybersecurity Specialist",
      category: "IT Security",
      rating: 4.8,
      reviewCount: 89,
      location: "Virginia Beach, VA",
      responseTime: "1-2 hours",
      hourlyRate: 125,
      isVerified: true,
      skills: ["FISMA Compliance", "Risk Assessment", "Security Audits", "NIST Framework"]
    },
    {
      name: "Jennifer Martinez",
      title: "Government Proposal Writer",
      category: "Marketing",
      rating: 4.7,
      reviewCount: 156,
      location: "Arlington, VA",
      responseTime: "4-6 hours",
      hourlyRate: 95,
      isVerified: false,
      skills: ["Proposal Writing", "Technical Writing", "Capture Management", "Win Strategies"]
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mockVendors.map((vendor, index) => (
        <VendorCard
          key={index}
          {...vendor}
        />
      ))}
    </div>
  );
}