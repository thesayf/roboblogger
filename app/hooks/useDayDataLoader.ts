import { useState, useEffect } from 'react';
import { Block } from '@/app/utils/scheduleUtils';

interface DayData {
  _id: string;
  date: string;
  blocks: Block[];
  [key: string]: any;
}

export function useDayDataLoader(userId: string | null, isLoaded: boolean) {
  const [currentDay, setCurrentDay] = useState<'today' | 'tomorrow'>('today');
  const [userData, setUserData] = useState<any>(null);
  const [todayData, setTodayData] = useState<DayData | null>(null);
  const [tomorrowData, setTomorrowData] = useState<DayData | null>(null);
  const [isLoadingDays, setIsLoadingDays] = useState(true);

  // Load days data
  useEffect(() => {
    const loadDays = async () => {
      if (!isLoaded || !userId) return;
      
      setIsLoadingDays(true);
      
      try {
        // Get user data first
        const userResponse = await fetch(`/api/users/check-or-create?clerkId=${userId}`);
        if (!userResponse.ok) throw new Error('Failed to load user');
        const userData = await userResponse.json();
        setUserData(userData);
        
        // Get dates in local timezone
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;
        
        // Load today's data
        const todayResponse = await fetch(`/api/days/today?userId=${userData._id}&date=${today}`);
        if (!todayResponse.ok) throw new Error('Failed to load today');
        const todayData = await todayResponse.json();
        setTodayData(todayData);
        
        // Load tomorrow's data
        const tomorrowResponse = await fetch(`/api/days/today?userId=${userData._id}&date=${tomorrow}`);
        if (!tomorrowResponse.ok) throw new Error('Failed to load tomorrow');
        const tomorrowData = await tomorrowResponse.json();
        setTomorrowData(tomorrowData);
        
      } catch (error) {
        console.error('Error loading days:', error);
      } finally {
        setIsLoadingDays(false);
      }
    };
    
    loadDays();
  }, [isLoaded, userId]);

  // Get current day's blocks
  const getCurrentBlocks = (): Block[] => {
    if (!isLoadingDays) {
      const dayData = currentDay === 'today' ? todayData : tomorrowData;
      console.log('[useDayDataLoader] Getting blocks for', currentDay, ':', {
        hasData: !!dayData,
        blocksCount: dayData?.blocks?.length || 0,
        blocks: dayData?.blocks?.map((b: any) => ({ 
          id: b._id || b.id, 
          type: b.type, 
          metadata: b.metadata 
        }))
      });
      if (dayData && dayData.blocks) {
        // Map _id to id for frontend compatibility
        return dayData.blocks.map((block: any) => ({
          ...block,
          id: block._id || block.id,
          tasks: (block.tasks || []).map((task: any) => ({
            ...task,
            id: task._id || task.id,
          }))
        }));
      }
    }
    return [];
  };

  // Get current day's ID
  const getCurrentDayId = (): string | null => {
    if (!isLoadingDays) {
      const dayData = currentDay === 'today' ? todayData : tomorrowData;
      return dayData?._id || null;
    }
    return null;
  };

  // Function to refresh day data from database
  const refreshDayData = async () => {
    if (!userData) return;
    
    console.log('[useDayDataLoader] 🔄 Starting refresh for', currentDay);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;
      
      // Reload the current day's data
      const dateToRefresh = currentDay === 'today' ? today : tomorrow;
      console.log('[useDayDataLoader] Fetching day data for date:', dateToRefresh);
      const response = await fetch(`/api/days/today?userId=${userData._id}&date=${dateToRefresh}`);
      
      if (response.ok) {
        const freshData = await response.json();
        console.log('[useDayDataLoader] ✅ Received fresh data:', {
          dayId: freshData._id,
          blocksCount: freshData.blocks?.length || 0,
          blocks: freshData.blocks?.map((b: any) => ({ 
            id: b._id || b.id, 
            type: b.type,
            title: b.title,
            metadata: b.metadata 
          }))
        });
        if (currentDay === 'today') {
          setTodayData(freshData);
        } else {
          setTomorrowData(freshData);
        }
      } else {
        console.error('[useDayDataLoader] ❌ Failed to refresh:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing day data:', error);
    }
  };

  return {
    currentDay,
    setCurrentDay,
    userData,
    todayData,
    tomorrowData,
    isLoadingDays,
    getCurrentBlocks,
    getCurrentDayId,
    refreshDayData,
  };
}