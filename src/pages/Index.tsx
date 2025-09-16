import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Download, Shield } from 'lucide-react';
import { useProgressEntries } from '@/hooks/useProgressEntries';
import DataEntryForm from '@/components/DataEntryForm';
import ViewSection from '@/components/ViewSection';
import ExportData from '@/components/ExportData';
import AdminControls from '@/components/AdminControls';

const Index = () => {
  const { entries, loading, error, addEntry, updateEntry, deleteEntry } = useProgressEntries();
  const [isAdmin] = useState(false); // Set to true for admin users

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
 <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <div className="container mx-auto px-4 py-6">
    
<div className="w-full text-center mb-8 space-y-1">
  <h1 className="text-4xl sm:text-5xl font-extrabold text-[#24346D] tracking - normal">
    Teach Zari
  </h1>
  <p className="text-lg sm:text-xl font-medium text-[#3B4C8A]">
    Academic Progress Tracker
  </p>
  <p className="text-sm italic text-[#5B6EA3] mt-2">
    developed by Krishna
  </p>
</div>


        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="entry" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Entry</span>
              <span className="sm:hidden">Add</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View Records</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">Admin</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry">
            <DataEntryForm onAddEntry={addEntry} existingEntries={entries} />
          </TabsContent>

          <TabsContent value="view">
            <ViewSection 
              entries={entries} 
              onUpdateEntry={updateEntry}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportData entries={entries} />
          </TabsContent>

          <TabsContent value="admin">
            <AdminControls 
              entries={entries}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
