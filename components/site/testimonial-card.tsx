import { Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        {testimonial.rating && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn("size-4", i < testimonial.rating! ? "fill-primary text-primary" : "text-muted-foreground")}
              />
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
        <p className="text-sm font-medium">{testimonial.clientName}</p>
      </CardContent>
    </Card>
  );
}
