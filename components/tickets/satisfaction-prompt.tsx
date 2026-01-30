"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SatisfactionForm } from "./satisfaction-form";

interface SatisfactionPromptProps {
  ticketId: string;
  ticketStatus: "open" | "in_progress" | "resolved" | "closed";
  isCustomer: boolean;
}

export function SatisfactionPrompt({
  ticketId,
  ticketStatus,
  isCustomer,
}: SatisfactionPromptProps) {
  const [open, setOpen] = useState(false);
  const [hasRating, setHasRating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user already rated this ticket
    const checkSatisfaction = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/satisfaction`);
        if (response.ok) {
          const data = await response.json();
          setHasRating(!!data.data);
        }
      } catch (error) {
        console.error("Error checking satisfaction:", error);
      }
    };

    checkSatisfaction();
  }, [ticketId]);

  useEffect(() => {
    // Show prompt when ticket is resolved and user is customer
    // and hasn't rated yet and hasn't dismissed the prompt
    if (
      ticketStatus === "resolved" &&
      isCustomer &&
      !hasRating &&
      !isDismissed
    ) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [ticketStatus, isCustomer, hasRating, isDismissed]);

  const handleSuccess = () => {
    setHasRating(true);
    setOpen(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setOpen(false);
  };

  if (!isCustomer || hasRating) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>서비스 만족도 평가</DialogTitle>
          <DialogDescription>
            티켓이 해결되었습니다. 받으신 서비스에 대해 평가해주시면 더 나은
            서비스 제공에 도움이 됩니다.
          </DialogDescription>
        </DialogHeader>
        <SatisfactionForm ticketId={ticketId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
