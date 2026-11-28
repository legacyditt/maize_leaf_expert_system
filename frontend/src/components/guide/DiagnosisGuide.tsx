import { ArrowRight, Camera, CheckSquare, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiagnosisGuideProps {
  onStart: () => void
  onOpenHistory: () => void
}

const STEPS = [
  {
    num: '01',
    icon: Camera,
    title: 'Unggah Foto Daun Jagung',
    desc: 'Ambil atau pilih foto bagian daun yang menunjukkan bercak atau perubahan warna. Anda juga bisa melewati tahap ini dan langsung menjawab pertanyaan gejala.',
  },
  {
    num: '02',
    icon: CheckSquare,
    title: 'Konfirmasi Gejala Fisik Daun',
    desc: 'Jawab serangkaian pertanyaan singkat mengenai kondisi permukaan atas dan bawah daun sesuai pengamatan langsung di lapangan.',
  },
  {
    num: '03',
    icon: ClipboardList,
    title: 'Lihat Hasil & Saran Penanganan',
    desc: 'Sistem menampilkan hasil identifikasi penyakit beserta langkah penanganan awal yang dapat langsung diterapkan.',
  },
] as const

const PHOTO_TIPS = [
  'Gunakan cahaya alami yang cukup terang dan hindari bayangan menutupi daun.',
  'Arahkan kamera fokus pada area daun yang bergejala (tidak blur).',
  'Usahakan satu helai daun terlihat jelas sebagai objek utama foto.',
] as const

const DISEASE_SCOPE = [
  {
    name: 'Karat Daun',
    note: 'Ditandai bintik atau pustula serbuk cokelat kekuningan pada daun.',
  },
  {
    name: 'Hawar Daun',
    note: 'Ditandai bercak memanjang seperti cerutu berwarna keabu-abuan hingga cokelat.',
  },
  {
    name: 'Daun Sehat',
    note: 'Permukaan daun bersih tanpa bercak hawar maupun bintik karat.',
  },
] as const

/**
 * Halaman Panduan Pemakaian MaizeCare dengan layout split asimetris 2 kolom
 * (Forest & Bone, bebas AI slop).
 */
export function DiagnosisGuide({
  onStart,
  onOpenHistory,
}: DiagnosisGuideProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid items-start gap-10 md:grid-cols-12">
        {/* Kolom Kiri (7 kolom): Alur Pemakaian & Tips Foto */}
        <div className="space-y-8 md:col-span-7">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#111814]">
              Panduan Pemeriksaan Daun Jagung
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
              Ikuti panduan singkat berikut sebelum memulai pemeriksaan agar hasil
              analisis foto dan gejala lebih akurat.
            </p>
          </div>

          <div className="divide-y divide-[#E4E4DF] border-y border-[#E4E4DF]">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="flex items-start gap-4 py-5">
                  <span className="font-mono text-xs font-bold text-[#CA8A04] pt-1">
                    {step.num}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#1B4332]" strokeWidth={1.8} />
                      <h2 className="text-sm font-semibold text-[#111814]">
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#111814]">
              Tips Pengambilan Foto
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              {PHOTO_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4332]" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Kolom Kanan (5 kolom): Cakupan Penyakit, Catatan, & CTA */}
        <aside className="space-y-6 rounded-xl border border-[#E4E4DF] bg-white p-6 md:col-span-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#111814]">
              Kondisi yang Dapat Dideteksi
            </h2>
            <div className="divide-y divide-zinc-100 border-t border-zinc-100">
              {DISEASE_SCOPE.map((item) => (
                <div key={item.name} className="py-3">
                  <p className="text-sm font-semibold text-[#1B4332]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E4E4DF] pt-4">
            <p className="text-xs font-semibold text-[#111814]">
              Catatan Penting
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              Hasil pemeriksaan ini berfungsi sebagai skrining awal di lapangan.
              Untuk serangan berat atau gejala di luar daftar, tetap konsultasikan
              dengan penyuluh atau pakar pertanian setempat.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <Button size="lg" onClick={onStart} className="w-full">
              Mulai Pemeriksaan
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onOpenHistory}
              className="w-full"
            >
              Lihat Riwayat Pemeriksaan
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

