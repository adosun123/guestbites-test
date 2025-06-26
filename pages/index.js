import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [zip, setZip] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    if (zip.length === 5) {
      router.push(`/guide/${zip}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">GuestBites: Create Your Guest Guide</h1>
      <input
        type="text"
        placeholder="Enter ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        className="border border-gray-300 p-2 rounded mb-4 w-64 text-center"
      />
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Generate Guide
      </button>
    </div>
  );
}
