
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDateForStorage, createDateFromString } from '@/utils/dateUtils';
import { ProgressEntry } from '@/types/progressEntry';

export const useProgressEntries = () => {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch entries with pagination and optimized query
  const fetchEntries = async (limit = 100) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedEntries = data?.map(entry => ({
        id: entry.id,
        date: createDateFromString(entry.date),
        day: entry.day,
        volunteerName: entry.volunteer_name || '',
        kidsTaught: entry.kids_taught || [],
        class: entry.class,
        topicTaught: entry.topic_taught,
        homework: entry.homework || '',
        created_at: entry.created_at,
        updated_at: entry.updated_at
      })) || [];

      setEntries(formattedEntries);
      setError(null);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load entries');
      toast({
        title: "Error",
        description: "Failed to load progress entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new entry
  const addEntry = async (entry: Omit<ProgressEntry, 'id'>) => {
    try {
      const dateStr = formatDateForStorage(entry.date);

      const insertData = {
        date: dateStr,
        day: entry.day,
        volunteer_name: entry.volunteerName || '',
        kids_taught: entry.kidsTaught,
        class: entry.class,
        topic_taught: entry.topicTaught,
        homework: entry.homework || ''
      };

      const { data, error } = await supabase
        .from('progress_entries')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newEntry: ProgressEntry = {
        id: data.id,
        date: createDateFromString(data.date),
        day: data.day,
        volunteerName: data.volunteer_name || '',
        kidsTaught: data.kids_taught || [],
        class: data.class,
        topicTaught: data.topic_taught,
        homework: data.homework || '',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setEntries(prev => [newEntry, ...prev.slice(0, 99)]);
      
      toast({
        title: "Success",
        description: "Progress entry added successfully"
      });

      return newEntry;
    } catch (err) {
      console.error('Error adding entry:', err);
      toast({
        title: "Error",
        description: "Failed to add progress entry",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<ProgressEntry>) => {
    try {
      const updateData: any = {};
      
      if (updates.date) {
        updateData.date = formatDateForStorage(updates.date);
      }
      if (updates.day) {
        updateData.day = updates.day;
      }
      if (updates.volunteerName !== undefined) {
        updateData.volunteer_name = updates.volunteerName;
      }
      if (updates.kidsTaught) {
        updateData.kids_taught = updates.kidsTaught;
      }
      if (updates.class) {
        updateData.class = updates.class;
      }
      if (updates.topicTaught) {
        updateData.topic_taught = updates.topicTaught;
      }
      if (updates.homework !== undefined) {
        updateData.homework = updates.homework;
      }

      const { data, error } = await supabase
        .from('progress_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry: ProgressEntry = {
        id: data.id,
        date: createDateFromString(data.date),
        day: data.day,
        volunteerName: data.volunteer_name || '',
        kidsTaught: data.kids_taught || [],
        class: data.class,
        topicTaught: data.topic_taught,
        homework: data.homework || '',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ));

      toast({
        title: "Success",
        description: "Progress entry updated successfully"
      });

      return updatedEntry;
    } catch (err) {
      console.error('Error updating entry:', err);
      toast({
        title: "Error",
        description: "Failed to update progress entry",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('progress_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== id));

      toast({
        title: "Success",
        description: "Progress entry deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting entry:', err);
      toast({
        title: "Error",
        description: "Failed to delete progress entry",
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries
  };
};
