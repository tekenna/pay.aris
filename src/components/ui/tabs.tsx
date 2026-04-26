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
      className="mb-6 w-full max-w-fit"
    />
  );
}
