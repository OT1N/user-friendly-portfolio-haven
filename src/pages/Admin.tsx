import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Upload, Image as ImageIcon, LogOut, Lock, Calendar, Trash2, Filter, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";
import FeedbackAnalytics from "@/components/ui/FeedbackAnalytics";

const ADMIN_EMAIL = "pauloabaquita098956@gmail.com";
const ADMIN_PASSWORD = "098956470123paulo";

interface SidelineEntry {
  id: string;
  title: string | null;
  date_uploaded: string;
  image_urls: any; // Will be parsed as JSON
  thumbnail_url: string;
  optimized: boolean;
  created_at: string;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [batchTitle, setBatchTitle] = useState("");
  const [entries, setEntries] = useState<SidelineEntry[]>([]);
  
  // New state for table functionality
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [filteredEntries, setFilteredEntries] = useState<SidelineEntry[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === ADMIN_EMAIL) {
        setUser(user);
        await ensureAdminRole(user.id);
        fetchEntries();
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && session.user.email === ADMIN_EMAIL) {
        setUser(session.user);
        await ensureAdminRole(session.user.id);
        fetchEntries();
      } else {
        setUser(null);
        setEntries([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureAdminRole = async (userId: string) => {
    try {
      // Check if admin role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      // If no admin role exists, create one
      if (!existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (error && !error.message.includes('duplicate key value violates unique constraint')) {
          console.error('Error assigning admin role:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/assigning admin role:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('sideline')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  // Filter entries by date
  useEffect(() => {
    let filtered = entries;
    
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = entries.filter(entry => entry.date_uploaded === filterDate);
    }
    
    setFilteredEntries(filtered);
    
    // Reset selection when filter changes
    setSelectedEntries(new Set());
    setSelectAll(false);
  }, [entries, dateFilter]);

  // Handle individual checkbox selection
  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
    
    // Update select all checkbox
    setSelectAll(newSelected.size === filteredEntries.length && filteredEntries.length > 0);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEntries(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredEntries.map(entry => entry.id));
      setSelectedEntries(allIds);
      setSelectAll(true);
    }
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) {
      toast.error("Please select batches to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedEntries.size} selected batch(es)?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const entriesToDelete = filteredEntries.filter(entry => selectedEntries.has(entry.id));
      
      for (const entry of entriesToDelete) {
      // Delete files from storage
      for (const file of entry.image_urls) {
        const fileName = file.url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('sideline').remove([fileName]);
        }
      }
        
        // Delete from database
        const { error } = await supabase
          .from('sideline')
          .delete()
          .eq('id', entry.id);
          
        if (error) throw error;
      }

      toast.success(`Successfully deleted ${selectedEntries.size} batch(es)`);
      setSelectedEntries(new Set());
      setSelectAll(false);
      fetchEntries();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error("Failed to delete some batches");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      toast.error("Invalid credentials");
      return;
    }

    setLoading(true);
    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // If user doesn't exist, create the account
        if (signInError.message.includes('Invalid login credentials')) {
          toast.info("Creating admin account...");
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`
            }
          });

          if (signUpError) {
            throw signUpError;
          }

          // If account was created and confirmed, assign admin role
          if (signUpData.user && !signUpData.user.email_confirmed_at) {
            toast.success("Admin account created! Please check your email to confirm your account, then try logging in again.");
            return;
          }
        } else {
          throw signInError;
        }
      }

      // Ensure admin role is assigned
      if (signInData?.user) {
        await ensureAdminRole(signInData.user.id);
      }
      
      toast.success("Login successful");
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail("");
    setPassword("");
    toast.success("Logged out successfully");
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setUploading(true);
    try {
      const imageUrls: Array<{ url: string; filename: string; type: string }> = [];
      let thumbnailUrl = "";

      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sideline')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('sideline')
          .getPublicUrl(filePath);

        imageUrls.push({
          url: publicUrl,
          filename: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        });

        // Use first file as thumbnail (for videos, this will be the video URL itself)
        if (i === 0) {
          thumbnailUrl = publicUrl;
        }
      }

      // Save batch to database
      const { error: dbError } = await supabase
        .from('sideline')
        .insert({
          title: batchTitle || null,
          date_uploaded: new Date().toISOString().split('T')[0],
          image_urls: imageUrls,
          thumbnail_url: thumbnailUrl,
          user_id: user.id
        });

      if (dbError) throw dbError;

      const imageCount = Array.from(selectedFiles).filter(f => f.type.startsWith('image/')).length;
      const videoCount = Array.from(selectedFiles).filter(f => f.type.startsWith('video/')).length;
      toast.success(`Successfully uploaded ${imageCount} images${videoCount > 0 ? ` and ${videoCount} videos` : ''}`);
      setSelectedFiles(null);
      setBatchTitle("");
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh entries
      fetchEntries();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteEntry = async (entry: SidelineEntry) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    try {
    // Delete files from storage
    for (const file of entry.image_urls) {
      const fileName = file.url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('sideline').remove([fileName]);
      }
    }

      // Delete from database
      const { error } = await supabase
        .from('sideline')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast.success("Batch deleted successfully");
      fetchEntries();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("Failed to delete batch");
    }
  };

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="container-section">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10">
                  <Lock size={16} className="text-primary" />
                  <span className="text-sm font-medium">Admin Access</span>
                </div>
                
                <h1 className="heading-lg mb-4">Admin Login</h1>
                <p className="text-muted-foreground">
                  Access restricted to authorized personnel only
                </p>
              </div>

              <form onSubmit={handleLogin} className="glass-card p-8">
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div className="mb-8">
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full btn-primary h-12 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock size={16} />
                      Login
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container-section">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10">
                <ImageIcon size={16} className="text-primary" />
                <span className="text-sm font-medium">Admin Dashboard</span>
              </div>
              
              <h1 className="heading-lg mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage sideline gallery and customer feedback
              </p>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sideline" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sideline" className="flex items-center gap-2">
                <ImageIcon size={16} />
                Sideline Management
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare size={16} />
                Feedback Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sideline" className="space-y-8">

              {/* Upload Section */}
              <div className="mb-12">
            <div className="glass-card p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Upload size={20} />
                Upload New Batch
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="batch-title" className="block text-sm font-medium mb-2">
                    Batch Title (Optional)
                  </label>
                  <input 
                    type="text" 
                    id="batch-title" 
                    value={batchTitle}
                    onChange={(e) => setBatchTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="e.g., Photo Shoot - January 2025"
                  />
                </div>

                <div>
                  <label htmlFor="file-input" className="block text-sm font-medium mb-2">
                    Select Images & Videos
                  </label>
                  <input 
                    type="file" 
                    id="file-input"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  {selectedFiles && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedFiles.length} file(s) selected ({Array.from(selectedFiles).filter(f => f.type.startsWith('image/')).length} images, {Array.from(selectedFiles).filter(f => f.type.startsWith('video/')).length} videos)
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleFileUpload}
                  disabled={uploading || !selectedFiles}
                  className="btn-primary h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

              {/* Entries Table */}
              <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Uploaded Batches ({filteredEntries.length})</h2>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 justify-start text-left font-normal"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {dateFilter && (
                      <div className="p-3 border-t">
                        <Button 
                          onClick={() => setDateFilter(undefined)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <X size={14} className="mr-1" />
                          Clear Filter
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Bulk Delete Button */}
                {selectedEntries.size > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    variant="destructive"
                    className="h-10"
                  >
                    {bulkDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-2" />
                        Delete Selected ({selectedEntries.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {filteredEntries.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <ImageIcon size={64} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {dateFilter ? "No batches found for selected date" : "No batches uploaded"}
                </h3>
                <p className="text-muted-foreground">
                  {dateFilter 
                    ? "Try selecting a different date or clear the filter."
                    : "Upload your first batch of images to get started."
                  }
                </p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="p-4 text-left font-medium">Thumbnail</th>
                        <th className="p-4 text-left font-medium">Title</th>
                        <th className="p-4 text-left font-medium">Date</th>
                        <th className="p-4 text-left font-medium">Files</th>
                        <th className="p-4 text-left font-medium">Status</th>
                        <th className="p-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, index) => (
                        <tr key={entry.id} className={`border-b hover:bg-muted/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id)}
                              onChange={() => handleSelectEntry(entry.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-4">
                            <img 
                              src={entry.thumbnail_url} 
                              alt={entry.title || "Untitled"}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-medium">
                              {entry.title || "Untitled Collection"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar size={14} />
                              {new Date(entry.date_uploaded).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-medium">
                              {entry.image_urls.length} files
                            </span>
                          </td>
                          <td className="p-4">
                            {entry.optimized ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <Check size={12} />
                                Optimized
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                <X size={12} />
                                Not Optimized
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <Button
                              onClick={() => deleteEntry(entry)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
              </div>
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;