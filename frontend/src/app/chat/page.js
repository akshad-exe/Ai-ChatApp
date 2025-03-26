import MainLayout from '@/components/layout/MainLayout';
import ChatWindow from '@/components/chat/ChatWindow';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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