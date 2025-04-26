
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
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [corners, setCorners] = useState<CardRegionAdjustment>({
    topLeft: { x: 0.2, y: 0.2 },
    topRight: { x: 0.8, y: 0.2 },
    bottomLeft: { x: 0.2, y: 0.8 },
    bottomRight: { x: 0.8, y: 0.8 }
  });
  const { toast } = useToast();
  
  // Load image and initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imageUrl) return;
    
    const img = new Image();
    imageRef.current = img;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image and corner points
      refreshCanvas();
    };
    
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Refresh canvas with current corners
  const refreshCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the card region (polygon)
    ctx.beginPath();
    const points = [
      { x: corners.topLeft.x * canvas.width, y: corners.topLeft.y * canvas.height },
      { x: corners.topRight.x * canvas.width, y: corners.topRight.y * canvas.height },
      { x: corners.bottomRight.x * canvas.width, y: corners.bottomRight.y * canvas.height },
      { x: corners.bottomLeft.x * canvas.width, y: corners.bottomLeft.y * canvas.height }
    ];
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    
    // Clear the card region to show original image
    ctx.save();
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    // Draw the polygon outline
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw corner points
    Object.entries(corners).forEach(([key, point]) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = activePoint === key ? '#ea384c' : '#fde047';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add label to help identify corners
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let label = '';
      switch(key) {
        case 'topLeft': label = 'TL'; break;
        case 'topRight': label = 'TR'; break;
        case 'bottomLeft': label = 'BL'; break;
        case 'bottomRight': label = 'BR'; break;
      }
      
      ctx.fillText(label, x, y);
    });
    
    // Draw connection lines between points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const getCornerAtPosition = (x: number, y: number): string | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const threshold = 20; // Detection radius in pixels
    
    // Check each corner point
    for (const [key, point] of Object.entries(corners)) {
      const pointX = point.x * canvas.width;
      const pointY = point.y * canvas.height;
      
      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
      if (distance < threshold) {
        return key;
      }
    }
    
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Get pointer position relative to canvas
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find which corner was clicked (if any)
    const cornerKey = getCornerAtPosition(x, y);
    setActivePoint(cornerKey);
    
    // Capture pointer to improve dragging
    if (cornerKey) {
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePoint || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate normalized position (0-1)
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / canvas.height));
    
    // Update the active corner
    setCorners(prev => ({
      ...prev,
      [activePoint]: { x, y }
    }));
    
    // Refresh the canvas
    refreshCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePoint && canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    setActivePoint(null);
  };
  
  const autoAlignCorners = () => {
    // Get the current corners
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;
    
    // Simple auto-alignment: make a more rectangular shape
    // Average the y-coordinates for top and bottom points
    const topY = (topLeft.y + topRight.y) / 2;
    const bottomY = (bottomLeft.y + bottomRight.y) / 2;
    
    // Average the x-coordinates for left and right points
    const leftX = (topLeft.x + bottomLeft.x) / 2;
    const rightX = (topRight.x + bottomRight.x) / 2;
    
    // Set new adjusted corners
    const alignedCorners: CardRegionAdjustment = {
      topLeft: { x: leftX, y: topY },
      topRight: { x: rightX, y: topY },
      bottomLeft: { x: leftX, y: bottomY },
      bottomRight: { x: rightX, y: bottomY }
    };
    
    setCorners(alignedCorners);
    refreshCanvas();
    
    toast({
      title: "Ecken ausgerichtet",
      description: "Die Ecken wurden automatisch zu einem Rechteck ausgerichtet.",
    });
  };

  const handleApply = () => {
    // Validate the adjustment (ensure it forms a reasonable quadrilateral)
    if (validateQuadrilateral(corners)) {
      onApply(corners);
      onClose();
    } else {
      toast({
        title: "Ungültige Auswahl",
        description: "Bitte korrigiere die Auswahl, die Karte wurde nicht korrekt erkannt.",
        variant: "destructive",
      });
    }
  };

  const validateQuadrilateral = (points: CardRegionAdjustment): boolean => {
    // Simple validation: check if points form a reasonable quadrilateral
    // 1. Check minimum size (at least 20% of the image in each dimension)
    const minWidth = Math.min(
      Math.abs(points.topRight.x - points.topLeft.x),
      Math.abs(points.bottomRight.x - points.bottomLeft.x)
    );
    
    const minHeight = Math.min(
      Math.abs(points.bottomLeft.y - points.topLeft.y),
      Math.abs(points.bottomRight.y - points.topRight.y)
    );
    
    if (minWidth < 0.2 || minHeight < 0.2) {
      return false;
    }
    
    // 2. Check for crossing lines (simplified check)
    // This is a simplified check that doesn't catch all invalid quads
    // but should catch severely distorted ones
    const isOrderedX = (
      points.topLeft.x <= points.topRight.x &&
      points.bottomLeft.x <= points.bottomRight.x
    );
    
    const isOrderedY = (
      points.topLeft.y <= points.bottomLeft.y &&
      points.topRight.y <= points.bottomRight.y
    );
    
    return isOrderedX && isOrderedY;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-4 rounded-lg max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Kartenbereich manuell anpassen</h3>
        
        <div className="bg-muted p-2 rounded-md mb-2">
          <p className="text-sm text-muted-foreground">
            Ziehen Sie die gelben Punkte, um die Ecken der Karte anzupassen. 
            Die Punkte sind beschriftet als: TL (Oben Links), TR (Oben Rechts), 
            BL (Unten Links), BR (Unten Rechts).
          </p>
        </div>
        
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
        
        <div className="flex justify-between gap-2 mb-4">
          <Button variant="secondary" onClick={autoAlignCorners}>
            Automatisch ausrichten
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleApply}>
              Anwenden
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
