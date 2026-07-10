export default function BlobBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] bg-blue-300/40 rounded-full blur-3xl animate-blob-a" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-indigo-300/40 rounded-full blur-3xl animate-blob-b" />
      <div className="absolute -bottom-32 left-1/4 w-[26rem] h-[26rem] bg-sky-300/30 rounded-full blur-3xl animate-blob-c" />
    </div>
  )
}
