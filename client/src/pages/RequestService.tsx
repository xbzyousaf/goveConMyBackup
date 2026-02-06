import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {AIServiceRequestForm} from "@/components/AIServiceRequestForm";

export default function RequestService() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const vendorId = params.get("vendorId");
  const serviceId = params.get("serviceId");

  if (!vendorId || !serviceId) {
    return <div className="p-6">Invalid request</div>;
  }

  return (
    <AIServiceRequestForm
      vendorId={vendorId}
      serviceId={serviceId}
    />
  );
}
