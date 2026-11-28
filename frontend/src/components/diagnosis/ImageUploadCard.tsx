import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Check, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  predictLeafImage,
  type EvaluateResponse,
  type PredictResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const SYMPTOM_HINTS: Record<string, string> = {
  G1: "Ciri khas karat daun: bintik serbuk cokelat kemerahan yang mudah menempel jika disentuh.",
  G2: "Biasanya terlihat bila serangan sudah meluas hingga warna daun memudar atau mengering.",
  G3: "Periksa sisi atas dan balik daun jagung untuk memastikan sebaran bintik serbuk.",
  G4: "Ciri khas hawar daun: bercak memanjang berbentuk elips atau seperti cerutu.",
  G5: "Sering muncul sebagai bercak tahap awal sebelum melebar dan mengering.",
  G6: "Daun terlihat hijau normal tanpa bintik cokelat ataupun bercak memanjang.",
  G7: "Seluruh helai daun tampak segar dan utuh.",
};

interface ImageUploadCardProps {
  expertState: EvaluateResponse | null;
  expertLoading: boolean;
  expertError: string | null;
  hasStarted: boolean;
  onImagePredicted: (prediction: PredictResponse, fileName: string) => void;
  onSkipToExpert: () => void;
  onAnswer: (factId: string, answer: "ya" | "tidak") => void;
}

/**
 * Halaman Pemeriksaan Terpadu: Brand header ringkas + Upload foto (CNN) +
 * Validasi gejala (Backward Chaining) dalam satu tampilan fokus.
 */
export function ImageUploadCard({
  expertState,
  expertLoading,
  expertError,
  hasStarted,
  onImagePredicted,
  onSkipToExpert,
  onAnswer,
}: ImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPredictError(null);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setPredictLoading(true);
    try {
      const result = await predictLeafImage(file);
      onImagePredicted(result, file.name);
    } catch (err) {
      setPredictError(
        err instanceof Error
          ? err.message
          : "Gagal menghubungi server FastAPI.",
      );
    } finally {
      setPredictLoading(false);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const factId = expertState?.next_fact_id ?? "";
  const goal = expertState?.current_goal ?? "";
  const combinedError = predictError || expertError;
  const isBusy = predictLoading || expertLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header Brand & Judul Halaman */}
      <header className="flex flex-col gap-5 border-b border-[#E4E4DF] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E4DF] bg-white">
              <svg
                width="22"
                height="26"
                viewBox="0 0 28 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M14 2C20 8 24 16 22 26C16 28 8 24 4 16C2 10 8 4 14 2Z"
                  fill="#1B4332"
                  stroke="#CA8A04"
                  strokeWidth="1.8"
                />
                <path
                  d="M14 6V24M14 12L19 9M14 17L9 14"
                  stroke="#FEF08A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight text-[#111814]">
                MaizeCare
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Sistem Pakar Daun Jagung
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#111814] md:text-3xl">
              Pemeriksaan Daun Jagung
            </h1>
            <p className="max-w-xl text-sm text-zinc-500">
              Unggah foto daun jagung, lalu jawab pertanyaan untuk memastikan
              kondisi tanaman.
            </p>
          </div>
        </div>

        <p className="text-xs font-medium text-zinc-500 sm:text-right">
          Karat · Hawar · Sehat
        </p>
      </header>

      {/* Panel Utama: Foto (5 kolom) & Validasi Gejala (7 kolom) */}
      <div className="grid gap-8 rounded-xl border border-[#E4E4DF] bg-white p-6 md:grid-cols-12 md:p-8">
        {/* Kolom Kiri: Dropzone & Preview Foto */}
        <div className="flex flex-col justify-between space-y-4 md:col-span-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors",
              isDragging
                ? "border-[#1B4332] bg-[#1B4332]/5"
                : "border-[#E4E4DF] bg-[#F8F7F4] hover:border-zinc-400",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileChange}
            />

            {previewUrl ? (
              <div className="w-full space-y-3">
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="mx-auto max-h-56 w-full rounded-md border border-[#E4E4DF] bg-white object-contain p-1"
                />
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-600">
                  <span className="truncate font-mono">{fileName}</span>
                  <span className="shrink-0 font-medium text-[#1B4332]">
                    Ganti foto
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E4E4DF] bg-white">
                  <UploadCloud
                    className="h-5 w-5 text-[#1B4332]"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#111814]">
                    Pilih atau tarik foto daun ke sini
                  </p>
                  <p className="text-xs text-zinc-500">JPG, PNG, atau WEBP</p>
                </div>
              </div>
            )}
          </div>

          {!hasStarted && !predictLoading && (
            <div className="flex justify-start">
              <Button variant="ghost" size="sm" onClick={onSkipToExpert}>
                Lewati foto, langsung tanya gejala →
              </Button>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Validasi Gejala (Backward Chaining) */}
        <div className="flex flex-col justify-between md:col-span-7 md:border-l md:border-[#E4E4DF] md:pl-8">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <span className="text-sm font-semibold text-[#111814]">
              Validasi Gejala
            </span>
            {expertState?.step_index && expertState?.total_steps && (
              <span className="font-mono text-xs text-zinc-500">
                Pertanyaan {expertState.step_index} / {expertState.total_steps}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center py-6">
            {combinedError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {combinedError}
              </div>
            )}

            {isBusy && !expertState && (
              <div className="flex items-center gap-2.5 py-8 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
                {predictLoading
                  ? "Memeriksa foto daun..."
                  : "Menyiapkan pertanyaan gejala..."}
              </div>
            )}

            {!isBusy && !expertState && !combinedError && (
              <div className="flex min-h-[190px] flex-col items-center justify-center rounded-lg bg-[#F8F7F4] p-6 text-center text-sm text-zinc-500">
                <ImagePlus
                  className="mb-2.5 h-5 w-5 text-zinc-400"
                  strokeWidth={1.75}
                />
                Pertanyaan validasi gejala akan tampil otomatis setelah foto
                diunggah.
              </div>
            )}

            {expertState && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#1B4332]">
                  Pemeriksaan Kondisi · {goal}
                </p>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold leading-snug text-[#111814] md:text-2xl">
                    {expertState.next_fact_text}?
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {SYMPTOM_HINTS[factId] ??
                      "Jawab sesuai kondisi fisik daun yang diamati."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {expertState && (
            <div className="grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
              <button
                type="button"
                disabled={isBusy || !factId}
                onClick={() => onAnswer(factId, "ya")}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-[#1B4332] bg-[#1B4332] px-5 py-3.5 text-left text-white transition-colors hover:bg-[#143326] active:scale-[0.99] disabled:opacity-50"
              >
                <span className="text-sm font-semibold">Ya, Benar</span>
                <Check className="h-4 w-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                disabled={isBusy || !factId}
                onClick={() => onAnswer(factId, "tidak")}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-[#E4E4DF] bg-white px-5 py-3.5 text-left text-[#111814] transition-colors hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-50"
              >
                <span className="text-sm font-semibold">Tidak</span>
                <X className="h-4 w-4 text-zinc-400" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
