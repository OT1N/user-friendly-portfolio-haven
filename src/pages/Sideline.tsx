import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, Download, Eye, Filter, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface SidelineEntry {
  id: string;
  title: string | null;
  date_uploaded: string;
  image_urls: any; // Will be parsed as JSON
  thumbnail_url: string;
  optimized: boolean;
  created_at: string;
}

const Sideline = () => {
  const [entries, setEntries] = useState<SidelineEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<SidelineEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SidelineEntry | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      // Format the selected date to match the database format (YYYY-MM-DD)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const filtered = entries.filter(entry => entry.date_uploaded === dateString);
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(entries);
    }
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('sideline')
        .select('*')
        .order('date_uploaded', { ascending: false });

      if (error) throw error;
      
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error("Failed to load sideline entries");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, filename: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'sideline-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${filename}`, {
        action: {
          label: "×",
          onClick: () => toast.dismiss(),
        },
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file", {
        action: {
          label: "×", 
          onClick: () => toast.dismiss(),
        },
      });
    }
  };

  const downloadAllFiles = async (entry: SidelineEntry) => {
    try {
      for (const [index, fileData] of entry.image_urls.entries()) {
        const response = await fetch(fileData.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileData.filename || `${entry.title || 'sideline'}_${index + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads to prevent browser blocking
        if (index < entry.image_urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      const fileCount = entry.image_urls.length;
      const imageCount = entry.image_urls.filter(f => f.type === 'image').length;
      const videoCount = entry.image_urls.filter(f => f.type === 'video').length;
      toast.success(`Downloaded ${fileCount} files${imageCount > 0 ? ` (${imageCount} images` : ''}${videoCount > 0 ? `${imageCount > 0 ? ', ' : ' ('}${videoCount} videos` : ''}${imageCount > 0 || videoCount > 0 ? ')' : ''} from ${entry.title || "collection"}`, {
        action: {
          label: "×",
          onClick: () => toast.dismiss(),
        },
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download files", {
        action: {
          label: "×",
          onClick: () => toast.dismiss(), 
        },
      });
    }
  };

  const openLightbox = (entry: SidelineEntry, imageIndex: number = 0) => {
    setSelectedEntry(entry);
    setLightboxImageIndex(imageIndex);
  };

  const closeLightbox = () => {
    setSelectedEntry(null);
    setLightboxImageIndex(0);
  };

  const nextImage = () => {
    if (selectedEntry && lightboxImageIndex < selectedEntry.image_urls.length - 1) {
      setLightboxImageIndex(lightboxImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (lightboxImageIndex > 0) {
      setLightboxImageIndex(lightboxImageIndex - 1);
    }
  };

  // Get unique dates for filter
  const uniqueDates = [...new Set(entries.map(entry => entry.date_uploaded))].sort().reverse().map(date => new Date(date));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container-section">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container-section">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10">
              <ImageIcon size={16} className="text-primary" />
              <span className="text-sm font-medium">Media Gallery</span>
            </div>
            
            <h1 className="heading-xl mb-6 gradient-text">
              Sideline Collection
            </h1>
            
            <p className="subheading max-w-2xl mx-auto">
              Explore curated image and video collections organized by upload date. Click on any batch to view the full gallery.
            </p>
          </div>

          {/* Date Filter */}
          <div className="mb-12 flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Filter by date:</span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white/50 backdrop-blur-sm hover:bg-white/70 justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>All dates</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white/90 backdrop-blur-sm border border-white/20" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => !uniqueDates.some(d => d.toDateString() === date.toDateString())}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="w-full"
                  >
                    Clear filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="secondary"
              onClick={() => setSelectedDate(undefined)}
              className="bg-secondary/10 text-secondary hover:bg-secondary/20"
            >
              View All Images
            </Button>
          </div>

          {/* Grid */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon size={64} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {selectedDate ? "No files uploaded on the selected date." : "No files have been uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300">
                   {/* Thumbnail */}
                  <div className="relative aspect-square overflow-hidden">
                    {entry.image_urls[0]?.type === 'video' ? (
                      <video 
                        src={entry.thumbnail_url} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        muted
                        playsInline
                      />
                    ) : (
                      <img 
                        src={entry.thumbnail_url} 
                        alt={entry.title || "Untitled"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button 
                        onClick={() => openLightbox(entry)}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                      >
                        <Eye size={18} className="text-white" />
                      </button>
                    </div>

                    {/* File count badge */}
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {entry.image_urls.length} {entry.image_urls.some(f => f.type === 'video') ? '📹' : '📷'}
                    </div>

                    {/* Optimized badge */}
                    {entry.optimized && (
                      <div className="absolute top-1 left-1 bg-green-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold mb-1 text-sm truncate">
                      {entry.title || "Untitled"}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Calendar size={10} />
                      {new Date(entry.date_uploaded).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => openLightbox(entry)}
                        className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={10} />
                        View
                      </button>
                      <button 
                        onClick={() => downloadAllFiles(entry)}
                        className="bg-secondary/10 text-secondary hover:bg-secondary/20 px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Download size={10} />
                        All
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            {/* Close button */}
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm rounded-full p-3 hover:bg-black/80 transition-colors text-white border border-white/20 shadow-lg"
            >
              <X size={20} />
            </button>

            {/* Image/Video */}
            <div className="relative">
              {selectedEntry.image_urls[lightboxImageIndex]?.type === 'video' ? (
                <video 
                  src={selectedEntry.image_urls[lightboxImageIndex]?.url} 
                  controls
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  playsInline
                />
              ) : (
                <img 
                  src={selectedEntry.image_urls[lightboxImageIndex]?.url} 
                  alt={selectedEntry.image_urls[lightboxImageIndex]?.filename}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}

              {/* Navigation */}
              {selectedEntry.image_urls.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    disabled={lightboxImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-4 hover:bg-black/80 transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    disabled={lightboxImageIndex === selectedEntry.image_urls.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-4 hover:bg-black/80 transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image counter */}
              {selectedEntry.image_urls.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-white/20">
                  {lightboxImageIndex + 1} / {selectedEntry.image_urls.length}
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="mt-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedEntry.title || "Untitled Collection"}</h3>
                  <p className="text-sm opacity-80">
                    {selectedEntry.image_urls[lightboxImageIndex]?.filename}
                  </p>
                </div>
                <button 
                  onClick={() => downloadFile(selectedEntry.image_urls[lightboxImageIndex].url, selectedEntry.image_urls[lightboxImageIndex].filename)}
                  className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Sideline;