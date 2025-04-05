'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/contexts/ChatContext';
import { api } from '@/services/api';

export default function CreateGroupChatDialog({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { createGroupChat } = useChat();

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      // Filter out already selected users
      const filteredUsers = response.data.filter(
        user => !selectedUsers.find(selected => selected.id === user.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u.id !== user.id));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Please select at least 2 users');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await createGroupChat({
        name: groupName,
        participants: selectedUsers.map(user => user.id)
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Group chat created successfully!',
        });
        onClose();
      } else {
        setError(response.error || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError('Failed to create group chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
            />
            <Button 
              onClick={handleSearchUsers}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-sm"
                >
                  <span>{user.username}</span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => handleAddUser(user)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleCreateGroup}
            disabled={loading || selectedUsers.length < 2 || !groupName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Group...
              </>
            ) : (
              'Create Group Chat'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 