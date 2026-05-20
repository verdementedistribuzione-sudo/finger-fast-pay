import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export function BarcodeDisplay({
  value,
  format,
  className,
  height = 100,
}: {
  value: string;
  format: string;
  className?: string;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isQR = /QR|AZTEC|PDF_417|DATA_MATRIX/i.test(format);

  useEffect(() => {
    if (isQR && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: height * 2.2,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).catch(() => {});
    } else if (svgRef.current) {
      const jbFormat = mapFormat(format);
      try {
        JsBarcode(svgRef.current, value, {
          format: jbFormat,
          height,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {
        // Fallback to CODE128 if format invalid
        try {
          JsBarcode(svgRef.current, value, { format: "CODE128", height, displayValue: false, margin: 0 });
        } catch {/* */}
      }
    }
  }, [value, format, height, isQR]);

  if (isQR) {
    return (
      <div className={"bg-white rounded-lg p-3 inline-block " + (className || "")}>
        <canvas ref={canvasRef} />
      </div>
    );
  }
  return (
    <div className={"bg-white rounded-lg p-3 " + (className || "")}>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}

function mapFormat(f: string): string {
  const up = f.toUpperCase();
  if (up.includes("EAN_13") || up === "EAN13") return "EAN13";
  if (up.includes("EAN_8") || up === "EAN8") return "EAN8";
  if (up.includes("UPC_A") || up === "UPCA") return "UPC";
  if (up.includes("CODE_39") || up === "CODE39") return "CODE39";
  if (up.includes("ITF")) return "ITF";
  return "CODE128";
}
