import { useEffect, useState } from 'react';
import { fetchTideData, type TideReading } from '../lib/api/noaa';

// TODO: hook into real NOAA endpoint, handle polling and refresh
export function useTideData() {
  const [data, setData] = useState<TideReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTideData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
