import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, Result } from "@zxing/library";
import { X, Zap, ZapOff, Loader2 } from "lucide-react";

export type ScanResult = { value: string; format: string };

const FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
];

export function BarcodeScanner({
  onResult,
  onClose,
}: {
  onResult: (r: ScanResult) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    let stopped = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const rear = devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[0];

        const controls = await reader.decodeFromVideoDevice(
          rear?.deviceId,
          videoRef.current!,
          (result: Result | undefined) => {
            if (result && !stopped) {
              stopped = true;
              onResult({ value: result.getText(), format: BarcodeFormat[result.getBarcodeFormat()] });
              controls.stop();
            }
          },
        );
        controlsRef.current = controls;
        setStarting(false);

        // Torch support
        const stream = (videoRef.current?.srcObject as MediaStream) || null;
        streamRef.current = stream;
        const track = stream?.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (caps?.torch) setTorchSupported(true);
      } catch (e) {
        setError((e as Error).message);
        setStarting(false);
      }
    })();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm">Inquadra QR o barcode</span>
        <button onClick={onClose} className="p-2"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {/* Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 border-2 border-gold rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
        </div>
        {error && (
          <div className="absolute bottom-20 inset-x-4 p-3 rounded-lg bg-red-600 text-white text-xs text-center">
            {error}. Apri da Safari/Chrome con HTTPS e consenti la fotocamera.
          </div>
        )}
      </div>
      {torchSupported && (
        <div className="p-4 flex justify-center">
          <button onClick={toggleTorch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {torchOn ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            Torcia
          </button>
        </div>
      )}
    </div>
  );
}
