"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  trialingUsers: number;
  canceledUsers: number;
  pastDueUsers: number;
  totalLifetimeCreditsPurchased: number;
}

interface UserRaw {
  _id: string;
  name?: string;
  email?: string;
  subscriptionStatus: string;
  credits: number;
  lifetimeCreditsUsed: number;
  lifetimeCreditsPurchased: number;
  stripeCustomerId?: string;
  subscriptionCurrentPeriodEnd?: string;
  trialEndsAt?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  credits: number;
  lifetimeUsed: number;
  lifetimePurchased: number;
  stripeCustomerId: string;
  subscriptionEndDate: string | null;
  trialEndDate: string | null;
  createdAt: string;
}

function mapUser(raw: UserRaw): User {
  return {
    id: raw._id,
    name: raw.name || "",
    email: raw.email || "",
    status: raw.subscriptionStatus || "none",
    credits: raw.credits || 0,
    lifetimeUsed: raw.lifetimeCreditsUsed || 0,
    lifetimePurchased: raw.lifetimeCreditsPurchased || 0,
    stripeCustomerId: raw.stripeCustomerId || "",
    subscriptionEndDate: raw.subscriptionCurrentPeriodEnd || null,
    trialEndDate: raw.trialEndsAt || null,
    createdAt: raw.createdAt,
  };
}

type SortKey = keyof User;
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  trialing: "bg-blue-100 text-blue-800 border-blue-200",
  canceled: "bg-red-100 text-red-800 border-red-200",
  past_due: "bg-orange-100 text-orange-800 border-orange-200",
  unpaid: "bg-red-100 text-red-800 border-red-200",
  none: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SuperAdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const stored = sessionStorage.getItem("superAdminAuth");
    if (stored) {
      setAuthed(true);
    }
  }, []);

  const getHeaders = useCallback(() => {
    const pw = sessionStorage.getItem("superAdminAuth") || "";
    return { "x-admin-password": pw };
  }, []);

  const fetchData = useCallback(async () => {
    setLoadingStats(true);
    setLoadingUsers(true);

    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/super-admin/stats", { headers: getHeaders() }),
        fetch("/api/super-admin/users", { headers: getHeaders() }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data.users || []).map(mapUser));
      }
    } catch {
      // silently handle fetch errors
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (authed) {
      fetchData();
    }
  }, [authed, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Ishaqsol1234!") {
      sessionStorage.setItem("superAdminAuth", password);
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("superAdminAuth");
    setAuthed(false);
    setStats(null);
    setUsers([]);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = users;
    if (q) {
      filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, search, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  // --- Password Gate ---
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-lg border border-[#E0DED8] bg-white p-8 shadow-sm"
        >
          <h1 className="font-serif text-2xl font-semibold text-[#111827]">
            Admin Login
          </h1>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-[#E0DED8]"
          />
          {authError && (
            <p className="text-sm text-red-600">Incorrect password.</p>
          )}
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    );
  }

  // --- Dashboard ---
  const statCards = [
    { label: "Total Users", value: stats?.totalUsers },
    { label: "Active Subscribers", value: stats?.activeSubscribers },
    { label: "Trialing", value: stats?.trialingUsers },
    { label: "Canceled", value: stats?.canceledUsers },
    { label: "Past Due", value: stats?.pastDueUsers },
    { label: "Credits Purchased", value: stats?.totalLifetimeCreditsPurchased },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#111827]">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">Roboblogger</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label} className="border-[#E0DED8]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-[#111827]">
                  {card.value ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-[#E0DED8] bg-white">
        <div className="border-b border-[#E0DED8] p-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm border-[#E0DED8]"
          />
        </div>

        {loadingUsers ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "name" as SortKey, label: "Name" },
                    { key: "email" as SortKey, label: "Email" },
                    { key: "status" as SortKey, label: "Status" },
                    { key: "credits" as SortKey, label: "Credits" },
                    { key: "lifetimeUsed" as SortKey, label: "Lifetime Used" },
                    {
                      key: "lifetimePurchased" as SortKey,
                      label: "Lifetime Purchased",
                    },
                    {
                      key: "stripeCustomerId" as SortKey,
                      label: "Stripe ID",
                    },
                    {
                      key: "subscriptionEndDate" as SortKey,
                      label: "Sub End Date",
                    },
                    { key: "trialEndDate" as SortKey, label: "Trial End" },
                    { key: "createdAt" as SortKey, label: "Joined" },
                  ].map((col) => (
                    <TableHead
                      key={col.key}
                      className="cursor-pointer select-none whitespace-nowrap text-xs hover:text-[#111827]"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortIndicator(col.key)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-8 text-center text-gray-400"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_COLORS[user.status] || STATUS_COLORS.none
                          }
                        >
                          {user.status || "none"}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.round((user.credits ?? 0) * 100) / 100}</TableCell>
                      <TableCell>{user.lifetimeUsed ?? 0}</TableCell>
                      <TableCell>{user.lifetimePurchased ?? 0}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.stripeCustomerId || "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.subscriptionEndDate)}
                      </TableCell>
                      <TableCell>{formatDate(user.trialEndDate)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
