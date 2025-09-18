import { useState } from "react";
import { Star, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    rating: "5",
    suggestion: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.name.trim() || !formData.age.trim() || !formData.suggestion.trim()) {
        toast.error("Please fill in all fields");
        return;
      }

      const age = parseInt(formData.age);
      if (age <= 0 || isNaN(age)) {
        toast.error("Please enter a valid age");
        return;
      }

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('suggestions')
        .insert({
          name: formData.name.trim(),
          age: age,
          rating: parseInt(formData.rating),
          suggestion: formData.suggestion.trim()
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error("Failed to save suggestion");
        return;
      }

      // Send email using existing contact form function
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: "feedback@system.com", // System email since users don't provide email
          message: `New Feedback Received!\n\nName: ${formData.name}\nAge: ${age}\nRating: ${formData.rating}/5 stars\n\nSuggestion:\n${formData.suggestion}`,
          to: "pauloabaquita098956@gmail.com"
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't show error to user since suggestion was saved successfully
      }

      // Clear form and show success
      setFormData({ name: "", age: "", rating: "5", suggestion: "" });
      toast.success("Thank you for your feedback! 🎉");
      
      // Auto-close panel after 1.2s
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);

    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Give Feedback ✨
        </Button>
      )}

      {/* Feedback Panel */}
      {isOpen && (
        <Card className="w-80 p-4 shadow-xl animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Share Your Feedback</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="feedback-name">Name</Label>
              <Input
                id="feedback-name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            {/* Age Field */}
            <div className="space-y-2">
              <Label htmlFor="feedback-age">Age</Label>
              <Input
                id="feedback-age"
                type="number"
                placeholder="Your age"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                required
              />
            </div>

            {/* Rating Field */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <RadioGroup
                value={formData.rating}
                onValueChange={(value) => handleInputChange("rating", value)}
                className="flex items-center space-x-2"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-1">
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm">{rating}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Suggestion Field */}
            <div className="space-y-2">
              <Label htmlFor="feedback-suggestion">Your Suggestion</Label>
              <Textarea
                id="feedback-suggestion"
                placeholder="Tell us what you think..."
                rows={3}
                value={formData.suggestion}
                onChange={(e) => handleInputChange("suggestion", e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Submit Feedback"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};