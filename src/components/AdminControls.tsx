
import React, { useState } from 'react';
import { Shield, Lock, Trash2, Edit3, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import StudentEditModal from './StudentEditModal';

interface ProgressEntry {
  id: string;
  date: Date;
  day: string;
  kidsTaught: string[];
  class: string;
  topicTaught: string;
  homework: string;
}

interface AdminControlsProps {
  entries: ProgressEntry[];
  onUpdateEntry: (id: string, updatedEntry: Partial<ProgressEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({ entries, onUpdateEntry, onDeleteEntry }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null);

  // Test passcode: admin123
  const ADMIN_PASSCODE = 'lamani123';

  const handleLogin = () => {
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setPasscode('');
      toast({
        title: "Admin Access Granted",
        description: "You now have admin privileges to edit and delete entries."
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid passcode. Please try again.",
        variant: "destructive"
      });
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Admin Session Ended",
      description: "You have been logged out of admin controls."
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      onDeleteEntry(entryId);
      toast({
        title: "Entry Deleted",
        description: "The progress entry has been successfully deleted."
      });
    }
  };

  const handleEditEntry = (entry: ProgressEntry) => {
    setEditingEntry(entry);
  };

  const handleUpdateEntry = (updatedEntry: ProgressEntry) => {
    onUpdateEntry(updatedEntry.id, updatedEntry);
    setEditingEntry(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-red-200 shadow-xl max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Admin Access Required</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto text-red-500 mb-2" />
                <p className="text-gray-600">
                  Enter the admin passcode to access editing and deletion controls.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passcode">Admin Passcode</Label>
                <div className="relative">
                  <Input
                    id="passcode"
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin();
                      }
                    }}
                    placeholder="Enter passcode"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasscode(!showPasscode)}
                  >
                    {showPasscode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                Access Admin Controls
              </Button>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Test Passcode:</strong> admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Admin Controls</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Logout
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-medium">Admin access granted</p>
              <p className="text-sm text-gray-600">You can now edit and delete entries</p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              {entries.length} Total Entries
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Entries Management */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <span>Manage All Entries</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {entries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No entries found to manage.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <span>{format(entry.date, 'MMM dd, yyyy')} ({entry.day})</span>
                          </Badge>
                          <Badge variant="secondary">{entry.class}</Badge>
                          <Badge variant="outline">
                            {entry.kidsTaught.length} student{entry.kidsTaught.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-gray-900">Students:</p>
                            <p className="text-sm text-gray-700">{entry.kidsTaught.join(', ')}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">Topic:</p>
                            <p className="text-sm text-gray-700">{entry.topicTaught}</p>
                          </div>
                          
                          {entry.homework && (
                            <div>
                              <p className="font-medium text-gray-900">Homework:</p>
                              <p className="text-sm text-gray-700">{entry.homework}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                          className="flex items-center space-x-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingEntry && (
        <StudentEditModal
          entry={editingEntry}
          onUpdate={handleUpdateEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
};

export default AdminControls;
