'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, Loader } from 'lucide-react'
import dynamic from 'next/dynamic'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number }
  initialAddress?: string
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation,
  initialAddress 
}: LocationPickerProps) {
  const [location, setLocation] = useState(initialLocation || { lat: 37.7749, lng: -122.4194 })
  const [address, setAddress] = useState(initialAddress || '')
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const getCurrentLocation = () => {
    setLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setLocation({ lat, lng })
          
          // Reverse geocode to get address
          const addr = await reverseGeocode(lat, lng)
          setAddress(addr)
          onLocationSelect({ lat, lng, address: addr })
          setLoading(false)
          toast.success('Location detected!')
        },
        (error) => {
          console.error('Geolocation error:', error)
          toast.error('Could not get your location. Please enter manually.')
          setLoading(false)
        }
      )
    } else {
      toast.error('Geolocation is not supported by your browser')
      setLoading(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  const searchAddress = async () => {
    if (!address.trim()) return
    
    setLoading(true)
    try {
      // Using Nominatim for forward geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setLocation({ lat, lng })
        setAddress(data[0].display_name)
        onLocationSelect({ lat, lng, address: data[0].display_name })
        toast.success('Location found!')
      } else {
        toast.error('Location not found. Please try a different address.')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Failed to search location')
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setLocation({ lat, lng })
    const addr = await reverseGeocode(lat, lng)
    setAddress(addr)
    onLocationSelect({ lat, lng, address: addr })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            label="Address"
            placeholder="Enter address or use current location"
            icon={<MapPin className="w-5 h-5" />}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
          />
        </div>
        <div className="flex gap-2 items-end">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            loading={loading}
            icon={<Navigation className="w-4 h-4" />}
            title="Use current location"
          >
            <span className="hidden sm:inline">Current</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={searchAddress}
            disabled={!address.trim()}
          >
            Search
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowMap(!showMap)}
        className="w-full"
      >
        {showMap ? 'Hide Map' : 'Show Map & Pick Location'}
      </Button>

      {showMap && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <MapComponent
            center={location}
            onLocationSelect={handleMapClick}
          />
        </div>
      )}

      {location && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium">Selected Location:</p>
          <p>Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  )
}
