import { useEffect, useRef, useState } from 'react';
import { callFn } from '../lib/api';

export type AddressTip = {
  name: string;
  address: string;
  location: string;
  district?: string;
};

export type AddressPlace = {
  name: string;
  address: string;
  lng: number | null;
  lat: number | null;
};

type AddressSuggestProps = {
  id?: string;
  value: string;
  placeholder?: string;
  onNameChange: (name: string) => void;
  onSelect: (place: AddressPlace) => void;
};

function asText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function parseLocation(location: unknown): { lng: number | null; lat: number | null } {
  const raw = asText(location);
  if (!raw.includes(',')) return { lng: null, lat: null };
  const [lngStr, latStr] = raw.split(',');
  const lng = parseFloat(lngStr);
  const lat = parseFloat(latStr);
  return {
    lng: Number.isFinite(lng) ? lng : null,
    lat: Number.isFinite(lat) ? lat : null,
  };
}

export function AddressSuggest({ id, value, placeholder, onNameChange, onSelect }: AddressSuggestProps) {
  const [tips, setTips] = useState<AddressTip[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function search(keyword: string) {
    onNameChange(keyword);
    if (timer.current) clearTimeout(timer.current);
    if (!keyword) {
      setTips([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const requestId = ++seq.current;
      try {
        const res = await callFn<AddressTip[]>('getAddressSuggestions', { keyword });
        if (requestId !== seq.current) return;
        setTips(res.ok ? res.data || [] : []);
      } catch {
        if (requestId !== seq.current) return;
        setTips([]);
      }
    }, 300);
  }

  function pick(tip: AddressTip) {
    const { lng, lat } = parseLocation(tip.location);
    onSelect({
      name: asText(tip.name),
      address: asText(tip.address),
      lng,
      lat,
    });
    setTips([]);
  }

  return (
    <div className="suggest">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => search(e.target.value)}
        onBlur={() => {
          setTimeout(() => setTips([]), 200);
        }}
      />
      {tips.length > 0 ? (
        <ul className="suggest-list" role="listbox">
          {tips.map((tip, index) => (
            <li key={`${tip.name}-${index}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(tip)}
              >
                <strong>{asText(tip.name)}</strong>
                <span>{asText(tip.address)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
