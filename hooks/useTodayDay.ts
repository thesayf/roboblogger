// hooks/useTodayDay.ts
import { useEffect } from "react";
import useSWR from "swr";
import { useAppContext } from "@/app/context/AppContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTodayDay() {
  const { setDay } = useAppContext();

  const { data, error, mutate } = useSWR("/api/days", fetcher);

  useEffect(() => {
    if (data) {
      setDay(data);
    }
  }, [data, setDay]);

  return {
    day: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
