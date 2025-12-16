"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { User, Day } from "@/app/context/models";
import { useAppContext } from "@/app/context/AppContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserAndDay() {
  const { isLoaded, userId } = useAuth();
  const { setDay, selectedDay } = useAppContext();

  // Fetch user data
  const { data: userData, error: userError } = useSWR(
    isLoaded && userId ? `/api/users/check-or-create?clerkId=${userId}` : null,
    fetcher
  );

  // Get the appropriate date based on selectedDay
  const getDate = () => {
    const today = new Date();
    if (selectedDay === "tomorrow") {
      today.setDate(today.getDate() + 1);
    }
    return today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // Fetch day data
  const {
    data: dayData,
    error: dayError,
    mutate,
  } = useSWR(
    userData
      ? `/api/days/today?userId=${userData._id}&date=${getDate()}`
      : null,
    fetcher
  );

  useEffect(() => {
    if (dayData) {
      setDay(dayData);
    }
  }, [dayData, setDay]);

  return {
    user: userData,
    day: dayData,
    isLoading: (!userError && !userData) || (!dayError && !dayData),
    isError: userError || dayError,
    mutate,
  };
}
