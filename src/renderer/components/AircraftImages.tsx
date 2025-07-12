import { useState, useEffect } from 'react';
import './AircraftImages.css';

// Define a simple in-memory cache outside the component to persist across renders
interface CachedEntry {
  images: ImageData[];
  timestamp: number;
}

const imageCache: Record<string, CachedEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface ImageData {
  Image: string;
  Link: string;
  Thumbnail: string;
  DateTaken: string;
  DateUploaded: string;
  Location: string;
  Photographer: string;
  Aircraft: string;
  Serial: string;
  Airline: string;
}

interface AircraftImagesProps {
  registration: string;
}

interface ApiResponse {
  Reg: string;
  Images: ImageData[];
}

export const AircraftImages = ({ registration }: AircraftImagesProps) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = imageCache[registration];
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
          setImages(cachedData.images);
          setLoading(false);
          return; // Use cached data
        }

        const response = await fetch(`https://www.jetapi.dev/api?reg=${registration}&only_jp=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft images');
        }
        const data: ApiResponse = await response.json();
        const fetchedImages = data.Images || [];
        setImages(fetchedImages);
        
        // Store in cache with current timestamp
        imageCache[registration] = { images: fetchedImages, timestamp: Date.now() };

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (registration) {
      fetchImages();
    }
  }, [registration]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return <div className="aircraft-images-loading">Loading images...</div>;
  }

  if (error) {
    return null; // Don't display anything if there's an error
  }

  if (images.length === 0) {
    return <div className="aircraft-images-empty">No images available</div>;
  }

  const currentImage = images[currentIndex];

  return (
    <div className="aircraft-images-container">
      <div 
        className="aircraft-image-wrapper"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img 
          src={currentImage.Image} 
          alt={`Aircraft ${registration}`}
          className="aircraft-image"
        />
        {/* Overlay description only on hover */}
        <div className={`image-info${hovered ? ' show' : ''}`}>
          <p className="image-info-line">{currentImage.Location}</p>
          <p className="image-info-line">{currentImage.DateTaken}</p>
          <p className="image-info-line">{currentImage.Photographer}</p>
        </div>
        {/* Arrow controls on the image */}
        {images.length > 1 && (
          <>
            <button 
              className={`image-arrow left${hovered ? ' show' : ''}`}
              onClick={handlePrevious}
              aria-label="Previous image"
              tabIndex={hovered ? 0 : -1}
            >
              &#8592;
            </button>
            <button 
              className={`image-arrow right${hovered ? ' show' : ''}`}
              onClick={handleNext}
              aria-label="Next image"
              tabIndex={hovered ? 0 : -1}
            >
              &#8594;
            </button>
            <span className={`image-counter-overlay${hovered ? ' show' : ''}`}>{currentIndex + 1} / {images.length}</span>
          </>
        )}
      </div>
    </div>
  );
}; 