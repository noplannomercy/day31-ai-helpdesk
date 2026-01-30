"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SatisfactionFormProps {
  ticketId: string;
  onSuccess?: () => void;
}

export function SatisfactionForm({
  ticketId,
  onSuccess,
}: SatisfactionFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("별점을 선택해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/satisfaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "만족도 제출에 실패했습니다");
      }

      toast.success("만족도 평가가 제출되었습니다");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting satisfaction:", error);
      toast.error(
        error instanceof Error ? error.message : "만족도 제출에 실패했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return "매우 불만족";
      case 2:
        return "불만족";
      case 3:
        return "보통";
      case 4:
        return "만족";
      case 5:
        return "매우 만족";
      default:
        return "별점을 선택해주세요";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>별점</Label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            {getRatingLabel(hoveredRating || rating)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">의견 (선택사항)</Label>
        <Textarea
          id="feedback"
          placeholder="서비스에 대한 의견을 자유롭게 작성해주세요..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? "제출 중..." : "만족도 제출"}
        </Button>
      </div>
    </form>
  );
}
