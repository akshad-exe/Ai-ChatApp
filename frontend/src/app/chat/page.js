'use client';

import MainLayout from '../../components/layouts/MainLayout';
import ChatWindow from '../../components/chat/ChatWindow';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="h-[calc(100vh-8rem)]">
          <ChatWindow />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
} 