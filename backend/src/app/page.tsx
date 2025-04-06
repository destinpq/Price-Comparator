'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Image from 'next/image';

interface PriceResult {
  platform: string;
  productTitle: string;
  price: string | null;
  available: boolean;
  deliveryEta: string | null;
  imageUrl?: string | null;
  error?: string;
}

interface ApiResponse {
  results: PriceResult[];
  timestamp: string;
}

// Change this to false to use the real scraper API
const USE_MOCK_API = true;

export default function Home() {
  const [item, setItem] = useState('');
  const [pincode, setPincode] = useState('');
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Choose API endpoint based on configuration
      const apiEndpoint = USE_MOCK_API ? '/api/mock-prices' : '/api/get-prices';
      
      const response = await fetch(`${apiEndpoint}?item=${encodeURIComponent(item)}&pincode=${pincode}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Grocery Price Comparison</h1>
      
      {USE_MOCK_API && (
        <div className={styles.mockBanner}>
          Using mock data for demonstration
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="item">Search Item:</label>
          <input
            id="item"
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g., milk, bread, eggs"
            required
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="pincode">Pincode:</label>
          <input
            id="pincode"
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g., 110001"
            required
            pattern="[0-9]{6}"
            title="Please enter a 6-digit pincode"
          />
        </div>
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Compare Prices'}
        </button>
      </form>
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className={styles.results}>
          <h2>Results from {results.results.length} platforms</h2>
          <p className={styles.timestamp}>As of {new Date(results.timestamp).toLocaleString()}</p>
          
          <div className={styles.cards}>
            {results.results.map((result, index) => (
              <div key={index} className={styles.card}>
                <h3>{result.platform}</h3>
                <div className={styles.productInfo}>
                  {result.imageUrl && (
                    <Image 
                      src={result.imageUrl} 
                      alt={result.productTitle}
                      className={styles.productImage}
                      width={500}
                      height={300}
                    />
                  )}
                  <div>
                    <p className={styles.productTitle}>{result.productTitle}</p>
                    {result.price ? (
                      <p className={styles.price}>{result.price}</p>
                    ) : (
                      <p className={styles.unavailable}>Price unavailable</p>
                    )}
                    <p className={styles.availability}>
                      {result.available ? '✅ In Stock' : '❌ Out of Stock'}
                    </p>
                    {result.deliveryEta && (
                      <p className={styles.deliveryEta}>
                        Delivery: {result.deliveryEta}
                      </p>
                    )}
                    {result.error && (
                      <p className={styles.error}>{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
