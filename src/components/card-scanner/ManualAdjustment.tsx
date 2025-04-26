
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardRegionAdjustment } from './types/adjustmentTypes';
import { useToast } from '@/hooks/use-toast';

interface ManualAdjustmentProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (adjustment: CardRegionAdjustment) => void;
  imageUrl: string;
}

export function ManualAdjustment({ isOpen, onClose, onApply, imageUrl }: ManualAdjustmentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [corners, setCorners] = useState<CardRegionAdjustment>({
    topLeft: { x: 0.2, y: 0.2 },
    topRight: { x: 0.8, y: 0.2 },
    bottomLeft: { x: 0.2, y: 0.8 },
    bottomRight: { x: 0.8, y: 0.8 }
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image and corner points
      drawAdjustmentUI(ctx, img, corners);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl, corners]);

  const drawAdjustmentUI = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    points: CardRegionAdjustment
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw the card region
    ctx.beginPath();
    ctx.moveTo(points.topLeft.x * ctx.canvas.width, points.topLeft.y * ctx.canvas.height);
    ctx.lineTo(points.topRight.x * ctx.canvas.width, points.topRight.y * ctx.canvas.height);
    ctx.lineTo(points.bottomRight.x * ctx.canvas.width, points.bottomRight.y * ctx.canvas.height);
    ctx.lineTo(points.bottomLeft.x * ctx.canvas.width, points.bottomLeft.y * ctx.canvas.height);
    ctx.closePath();
    
    // Clear the card region
    ctx.save();
    ctx.clip();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    // Draw corner points
    Object.entries(points).forEach(([key, point]) => {
      ctx.beginPath();
      ctx.arc(
        point.x * ctx.canvas.width,
        point.y * ctx.canvas.height,
        8,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = activePoint === key ? '#ea384c' : '#fde047';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    // Find closest corner point
    let closest = null;
    let minDist = Infinity;
    
    Object.entries(corners).forEach(([key, point]) => {
      const dist = Math.hypot(x - point.x, y - point.y);
      if (dist < minDist && dist < 0.1) { // Only select if within reasonable distance
        minDist = dist;
        closest = key;
      }
    });
    
    setActivePoint(closest);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePoint || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / canvas.height));
    
    setCorners(prev => ({
      ...prev,
      [activePoint]: { x, y }
    }));
  };

  const handlePointerUp = () => {
    setActivePoint(null);
  };

  const handleApply = () => {
    // Validate the adjustment (ensure it forms a reasonable quadrilateral)
    const isValidQuad = validateQuadrilateral(corners);
    
    if (!isValidQuad) {
      toast({
        title: "Ungültige Anpassung",
        description: "Bitte stellen Sie sicher, dass die Eckpunkte ein gültiges Viereck bilden.",
        variant: "destructive",
      });
      return;
    }
    
    onApply(corners);
    onClose();
  };

  const validateQuadrilateral = (points: CardRegionAdjustment): boolean => {
    // Simple validation: check if points form a reasonable quadrilateral
    const minSize = 0.2; // Minimum 20% of image size
    const maxSize = 0.9; // Maximum 90% of image size
    
    // Check if points are too close together
    const minDist = Math.min(
      Math.hypot(points.topRight.x - points.topLeft.x, points.topRight.y - points.topLeft.y),
      Math.hypot(points.bottomRight.x - points.bottomLeft.x, points.bottomRight.y - points.bottomLeft.y),
      Math.hypot(points.bottomLeft.x - points.topLeft.x, points.bottomLeft.y - points.topLeft.y),
      Math.hypot(points.bottomRight.x - points.topRight.x, points.bottomRight.y - points.topRight.y)
    );
    
    return minDist >= minSize && minDist <= maxSize;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-4 rounded-lg max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Kartenbereich manuell anpassen</h3>
        
        <div className="relative border rounded-lg overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            className="w-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Ziehen Sie die gelben Punkte, um die Ecken der Karte anzupassen.
        </p>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleApply}>
            Anwenden
          </Button>
        </div>
      </div>
    </div>
  );
}
