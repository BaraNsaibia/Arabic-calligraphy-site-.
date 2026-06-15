interface PriceTagProps {
  price: number;
  currency: string;
  layout?: "stack" | "inline";
  className?: string;
}

export default function PriceTag({
  price,
  currency,
  layout = "stack",
  className = "",
}: PriceTagProps) {
  if (layout === "inline") {
    return (
      <span className={`font-serif font-bold text-gold text-[18px] ${className}`}>
        {price}
        <span className="text-[10px] uppercase ml-1 text-zinc-500 font-sans font-medium">
          {currency}
        </span>
      </span>
    );
  }

  return (
    <span className={`font-serif font-bold text-gold text-[18px] ${className}`}>
      {price}
      <span className="text-[10px] uppercase ml-1 block text-zinc-500 font-sans font-medium">
        {currency}
      </span>
    </span>
  );
}
