import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-8">Maaf, halaman yang Anda cari tidak ada.</p>
        <Link 
          href="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
} 