'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(50),
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => {
      socket.off('notification');
    };
  }, [queryClient]);

  const unreadCount = notifications.filter((n: any) => n.status !== 'read').length;

  return { notifications, unreadCount };
}