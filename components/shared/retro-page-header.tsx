interface RetroPageHeaderProps {
  title: string
  description: string
}

export function RetroPageHeader({ title, description }: RetroPageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1
        className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_2px_2px_0_rgb(139_69_19),_3px_3px_0_rgb(101_51_15),_4px_4px_0_rgb(70_35_10)]"
        style={{ fontFamily: "Impact, fantasy" }}
      >
        {title}
      </h1>
      <p className="text-amber-200 text-lg font-semibold drop-shadow-md">{description}</p>
    </div>
  )
}
