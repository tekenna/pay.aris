import { SegmentedControl } from "@/components/ui/segmented-control";

export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      items={items}
      size="sm"
      className="mb-5 w-full max-w-fit gap-1.5 rounded-[10px] border border-[#e4e7ec] bg-[#f8fafb] p-1"
    />
  );
}
