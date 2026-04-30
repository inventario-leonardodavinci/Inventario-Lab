import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X, ZoomIn, RotateCw, Check, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  imagen: string;
  abierto: boolean;
  onCancelar: () => void;
  onAplicar: (imagenRecortada: string) => void;
  onCambiarFoto?: () => void;
  onEliminarFoto?: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 256;
  outputCanvas.height = 256;
  const outputCtx = outputCanvas.getContext("2d");

  if (!outputCtx) {
    throw new Error("No 2d context");
  }

  outputCtx.beginPath();
  outputCtx.arc(128, 128, 128, 0, Math.PI * 2);
  outputCtx.closePath();
  outputCtx.clip();

  outputCtx.drawImage(canvas, 0, 0, 256, 256);

  return outputCanvas.toDataURL("image/jpeg", 0.9);
}

export function EditorRecorteImagen({
  imagen,
  abierto,
  onCancelar,
  onAplicar,
  onCambiarFoto,
  onEliminarFoto,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleAplicar = async () => {
    if (!croppedAreaPixels || !imagen) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imagen,
        croppedAreaPixels,
        rotation
      );
      onAplicar(croppedImage);
    } catch (error) {
      console.error("Error al recortar la imagen:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col rounded-xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Editar foto de perfil</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelar}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative h-[400px] w-full bg-black/5">
          <Cropper
            image={imagen}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-6 px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Zoom</span>
              <span className="ml-auto text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Rotación</span>
              <span className="ml-auto text-xs text-muted-foreground">{Math.round(rotation)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
          <div className="flex gap-2">
            {onCambiarFoto && (
              <Button variant="outline" size="sm" onClick={onCambiarFoto} disabled={isProcessing} className="gap-2">
                <Upload className="size-4" />
                Cambiar foto
              </Button>
            )}
            {onEliminarFoto && (
              <Button variant="outline" size="sm" onClick={onEliminarFoto} disabled={isProcessing} className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancelar} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleAplicar} disabled={isProcessing || !croppedAreaPixels}>
              <Check className="mr-2 h-4 w-4" />
              {isProcessing ? "Procesando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
