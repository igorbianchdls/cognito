interface GetTimeData {
  location: string
  timezone: string
  localTimeISO: string
}

export default function GetTimeCard({ data }: { data: GetTimeData }) {
  const dt = new Date(data.localTimeISO.replace('T', ' ') + 'Z')
  const display = isNaN(dt.getTime()) ? data.localTimeISO : dt.toLocaleString()

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Local time</div>
          <div className="text-lg font-semibold">{display}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Location</div>
          <div className="text-sm font-medium">{data.location}</div>
          <div className="text-xs text-gray-500">{data.timezone}</div>
        </div>
      </div>
    </div>
  )
}

