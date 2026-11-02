import { useEffect, useState, type InputHTMLAttributes } from 'react';

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: number;
  onValueChange: (value: number) => void;
};

/*
 * A number field that keeps what the user types as text.
 *
 * <input type="number" value={number}> shows "05" when you type 5 into a
 * field holding 0, because React keeps the typed text while the number
 * stays the same. Holding the text here strips leading zeros and still
 * lets the field be empty while typing.
 */
export default function NumberInput({
  value,
  onValueChange,
  onBlur,
  ...rest
}: NumberInputProps) {
  const [text, setText] = useState(() => String(value ?? 0));

  // Follow changes made from outside (e.g. a product's rate filled in).
  useEffect(() => {
    setText((current) =>
      Number(current || 0) === Number(value || 0) ? current : String(value ?? 0)
    );
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        const raw = event.target.value.trim();

        if (!/^\d*\.?\d*$/.test(raw)) return;

        const cleaned = raw.replace(/^0+(?=\d)/, '');

        setText(cleaned);
        onValueChange(cleaned === '' || cleaned === '.' ? 0 : Number(cleaned));
      }}
      onBlur={(event) => {
        setText(String(Number(text || 0)));
        onBlur?.(event);
      }}
    />
  );
}
