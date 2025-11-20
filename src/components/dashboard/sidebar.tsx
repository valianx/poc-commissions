"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Store,
  Wallet,
  Percent,
  Calculator,
  BarChart3,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Merchants",
    href: "/dashboard/merchants",
    icon: Store,
  },
  {
    name: "Channels",
    href: "/dashboard/channels",
    icon: Wallet,
  },
  {
    name: "Commissions",
    href: "/dashboard/commissions",
    icon: Percent,
  },
  {
    name: "Simulator",
    href: "/dashboard/simulator",
    icon: Calculator,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Zippy POC</h1>
        <span className="ml-2 rounded bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-gray-900">
          PROTOTYPE
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-gray-400">admin@zippy.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
