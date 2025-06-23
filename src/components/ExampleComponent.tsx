"use client";

import { http } from "@/lib/http";
import { useEffect, useState } from "react";

interface ExampleData {
  message: string;
}

export default function ExampleComponent() {
  const [data, setData] = useState<ExampleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Make an authenticated request using the stored token
        const response = await http.get<ExampleData>('/api/example');
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Example Data</h2>
      <p>{data.message}</p>
    </div>
  );
} 