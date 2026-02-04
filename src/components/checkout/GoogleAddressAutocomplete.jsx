import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';

const GoogleAddressAutocomplete = ({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Enter your address",
  label = "Address",
  required = false,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Initialize Google Places API
  useEffect(() => {
    const initializeGooglePlaces = () => {
      try {
        // Wait a bit to ensure API is fully loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          // Check if AutocompleteService is available
          if (window.google.maps.places.AutocompleteService) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
          } else {
            console.warn('⚠️ Google Places AutocompleteService not available');
            return;
          }
          
          // Check if PlacesService is available
          if (window.google.maps.places.PlacesService) {
            placesService.current = new window.google.maps.places.PlacesService(
              document.createElement('div')
            );
          } else {
            console.warn('⚠️ Google Places PlacesService not available');
            return;
          }
          
          console.log('✅ Google Places API initialized');
        } else {
          console.warn('⚠️ Google Maps API not loaded');
        }
      } catch (error) {
        console.error('❌ Error initializing Google Places API:', error);
        // Silently fail - address autocomplete is optional
      }
    };

    const loadGoogleMapsAPI = async () => {
      try {
        // Fetch API key from backend
        const response = await fetch('http://localhost:3003/api/settings/google-places-api-key');
        const data = await response.json();
        const apiKey = data.google_places_api_key;
        
        if (!apiKey || apiKey === '') {
          console.warn('⚠️ Google Places API key not configured - address autocomplete disabled');
          return;
        }

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          // Small delay to ensure everything is ready
          setTimeout(initializeGooglePlaces, 100);
        } else {
          // Check if script is already being loaded
          const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
          if (existingScript) {
            // Script is already loading, wait for it
            existingScript.addEventListener('load', () => {
              setTimeout(initializeGooglePlaces, 100);
            });
            return;
          }

          // Load Google Maps API
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            // Add a small delay to ensure API is fully initialized
            setTimeout(initializeGooglePlaces, 100);
          };
          script.onerror = () => {
            console.error('❌ Failed to load Google Maps API - address autocomplete disabled');
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('❌ Error fetching Google Places API key:', error);
        // Silently fail - address autocomplete is optional
      }
    };

    loadGoogleMapsAPI();
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue.length > 2) {
      getPlacePredictions(inputValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const getPlacePredictions = (input) => {
    if (!autocompleteService.current) {
      // Silently fail if service is not available
      return;
    }

    try {
      setIsLoading(true);
      
      const handlePredictions = (predictions, status) => {
        setIsLoading(false);
        
        if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      };
      
      const request = {
        input,
        types: ['address']
      };
      
      autocompleteService.current.getPlacePredictions(request, handlePredictions);
    } catch (error) {
      console.error('❌ Error getting place predictions:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!placesService.current) {
      // Silently fail if service is not available
      return;
    }

    try {
      const handlePlaceDetails = (place, status) => {
        if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && place) {
        const addressComponents = place.address_components;
        const formattedAddress = place.formatted_address;
        
        // Parse address components
        const addressData = {
          address: formattedAddress,
          street1: '',
          street2: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        };

        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            addressData.street1 = component.long_name + ' ';
          } else if (types.includes('route')) {
            addressData.street1 += component.long_name;
          } else if (types.includes('locality')) {
            addressData.city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            addressData.state = component.long_name;
          } else if (types.includes('postal_code')) {
            addressData.zip = component.long_name;
          } else if (types.includes('country')) {
            addressData.country = component.short_name;
          }
        });

        // Clean up street1
        addressData.street1 = addressData.street1.trim();

        onChange(formattedAddress);
        onAddressSelect(addressData);
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'address_components', 'geometry']
    };

      placesService.current.getDetails(request, handlePlaceDetails);
    } catch (error) {
      console.error('❌ Error getting place details:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="address-autocomplete" className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </p>
                  {suggestion.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleAddressAutocomplete;