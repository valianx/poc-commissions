"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Wallet, Percent, TrendingUp } from "lucide-react";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useEffect } from "react";

export default function DashboardPage() {
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();
  const { assignments, fetchAssignments } = useCommissionsStore();

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchAssignments();
  }, [fetchMerchants, fetchChannels, fetchAssignments]);

  const stats = [
    {
      name: "Total Merchants",
      value: merchants.filter((m) => m.isActive).length,
      icon: Store,
      color: "bg-blue-500",
    },
    {
      name: "Active Channels",
      value: channels.filter((c) => c.isActive).length,
      icon: Wallet,
      color: "bg-green-500",
    },
    {
      name: "Active Commissions",
      value: assignments.filter((a) => a.status === "ACTIVE").length,
      icon: Percent,
      color: "bg-purple-500",
    },
    {
      name: "Revenue Growth",
      value: "+12.5%",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Resumen general del sistema de comisiones
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <div className={`${stat.color} rounded-lg p-2`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Merchants Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {merchants.slice(0, 5).map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{merchant.name}</p>
                    <p className="text-sm text-gray-500">{merchant.code}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      merchant.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {merchant.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channels Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channels.slice(0, 5).map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-gray-500">
                      {channel.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      channel.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {channel.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
