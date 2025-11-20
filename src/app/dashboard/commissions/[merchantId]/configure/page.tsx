"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function ConfigureCommissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;

  const preSelectedCountry = searchParams.get("country");
  const preSelectedChannel = searchParams.get("channel");

  useEffect(() => {
    // Redirect to simplified configuration form
    const queryParams = new URLSearchParams();
    if (preSelectedCountry) queryParams.set("country", preSelectedCountry);
    if (preSelectedChannel) queryParams.set("channel", preSelectedChannel);

    const queryString = queryParams.toString();
    router.replace(
      `/dashboard/commissions/${merchantId}/configure-simple${queryString ? `?${queryString}` : ""}`
    );
  }, [merchantId, preSelectedCountry, preSelectedChannel, router]);

  return null;
}
